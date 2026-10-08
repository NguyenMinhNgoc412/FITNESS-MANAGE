import ExpoModulesCore
import AVFoundation
import MediaPipeTasksVision
import UIKit

public class FitnessPoseModule: Module {
  private let lock = NSLock()
  private var cancelled = false
  private func setCancelled(_ value: Bool) { lock.lock(); cancelled = value; lock.unlock() }
  private func isCancelled() -> Bool { lock.lock(); defer { lock.unlock() }; return cancelled }
  public func definition() -> ModuleDefinition {
    Name("FitnessPose")
    Function("getAnalysisVersion") { 2 }
    Function("cancel") { self.setCancelled(true) }
    AsyncFunction("analyze") { (uri: String) -> [[String: Any]] in
      self.setCancelled(false)
      guard let url = URL(string: uri), url.isFileURL,
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first,
        url.resolvingSymlinksInPath().path.hasPrefix(documents.path + "/"),
        let model = Bundle.main.path(forResource: "pose_landmarker_lite", ofType: "task") else {
        throw NSError(domain: "FitnessPose", code: 1, userInfo: [NSLocalizedDescriptionKey: "Local video or model unavailable"])
      }
      let asset = AVURLAsset(url: url)
      let duration = CMTimeGetSeconds(asset.duration)
      guard duration.isFinite && duration > 0 && duration <= 120 else {
        throw NSError(domain: "FitnessPose", code: 2, userInfo: [NSLocalizedDescriptionKey: "Video must be at most two minutes"])
      }
      let options = PoseLandmarkerOptions()
      options.baseOptions.modelAssetPath = model
      options.runningMode = .video
      options.numPoses = 1
      options.minPoseDetectionConfidence = 0.6
      options.minPosePresenceConfidence = 0.6
      let detector = try PoseLandmarker(options: options)
      let generator = AVAssetImageGenerator(asset: asset)
      generator.appliesPreferredTrackTransform = true
      generator.maximumSize = CGSize(width: 640, height: 640)
      generator.requestedTimeToleranceBefore = .zero
      generator.requestedTimeToleranceAfter = .zero
      defer { generator.cancelAllCGImageGeneration() }
      var samples: [[String: Any]] = []
      for timestamp in stride(from: 100, to: Int(duration * 1000), by: 100) {
        if self.isCancelled() {
          throw NSError(domain: "FitnessPose", code: 3, userInfo: [NSLocalizedDescriptionKey: "Analysis cancelled"])
        }
        let sample: [String: Any] = try autoreleasepool {
          let cg = try generator.copyCGImage(at: CMTime(value: Int64(timestamp), timescale: 1000), actualTime: nil)
          let image = try MPImage(uiImage: UIImage(cgImage: cg))
          let result = try detector.detect(videoFrame: image, timestampInMilliseconds: timestamp)
          var angle = 0.0, visibility = 0.0
          if let pose = result.landmarks.first, pose.count >= 29 {
            let left = [23, 25, 27], right = [24, 26, 28]
            let confidence: (Int) -> Double = { pose[$0].visibility?.doubleValue ?? 0 }
            let side = left.map(confidence).reduce(0, +) >= right.map(confidence).reduce(0, +) ? left : right
            let a = pose[side[0]], b = pose[side[1]], c = pose[side[2]]
            visibility = side.map(confidence).min() ?? 0
            let ux = Double(a.x - b.x) * Double(cg.width), uy = Double(a.y - b.y) * Double(cg.height)
            let vx = Double(c.x - b.x) * Double(cg.width), vy = Double(c.y - b.y) * Double(cg.height)
            let denominator = hypot(ux, uy) * hypot(vx, vy)
            if denominator > 0 { angle = acos(max(-1, min(1, (ux * vx + uy * vy) / denominator))) * 180 / .pi }
          }
          // Minimized local bridge data; omit face landmarks and never return video frames.
          let landmarks: [[String: Double]] = (0...28).map { index in
            guard (11...16).contains(index) || (23...28).contains(index),
              let pose = result.landmarks.first, index < pose.count else {
              return ["x": 0, "y": 0, "visibility": 0]
            }
            let point = pose[index]
            return ["x": Double(point.x), "y": Double(point.y), "visibility": point.visibility?.doubleValue ?? 0]
          }
          return ["timeMs": Double(timestamp), "kneeAngle": angle, "visibility": visibility, "frameWidth": cg.width, "frameHeight": cg.height, "landmarks": landmarks]
        }
        samples.append(sample)
      }
      return samples
    }.runOnQueue(.global(qos: .userInitiated))
  }
}
