package expo.modules.fitnesspose

import android.graphics.Bitmap
import android.graphics.Matrix
import android.media.MediaMetadataRetriever
import android.net.Uri
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.acos
import kotlin.math.hypot
import kotlin.math.max

class FitnessPoseModule : Module() {
  private val cancelled = AtomicBoolean(false)
  override fun definition() = ModuleDefinition {
    Name("FitnessPose")
    Function("cancel") { cancelled.set(true) }
    AsyncFunction("analyze") { uri: String ->
      cancelled.set(false)
      val context = appContext.reactContext ?: error("App unavailable")
      val file = File(Uri.parse(uri).path ?: error("Invalid local file")).canonicalFile
      require(Uri.parse(uri).scheme == "file" && file.path.startsWith(context.filesDir.canonicalPath + File.separator) && file.isFile) { "Video must be app-local" }
      val retriever = MediaMetadataRetriever()
      var detector: PoseLandmarker? = null
      try {
        retriever.setDataSource(file.path)
        val duration = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLong() ?: 0L
        require(duration in 1..120000) { "Video must be at most two minutes" }
        val rotation = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toFloat() ?: 0f
        val options = PoseLandmarker.PoseLandmarkerOptions.builder()
          .setBaseOptions(BaseOptions.builder().setModelAssetPath("pose_landmarker_lite.task").build())
          .setRunningMode(RunningMode.VIDEO).setNumPoses(1)
          .setMinPoseDetectionConfidence(0.6f).setMinPosePresenceConfidence(0.6f).build()
        detector = PoseLandmarker.createFromOptions(context, options)
        val samples = mutableListOf<Map<String, Double>>()
        var time = 100L
        while (time < duration) {
          if (cancelled.get()) error("Analysis cancelled")
          val decoded = retriever.getScaledFrameAtTime(time * 1000, MediaMetadataRetriever.OPTION_CLOSEST, 640, 640)
          if (decoded == null) {
            samples.add(mapOf("timeMs" to time.toDouble(), "kneeAngle" to 0.0, "visibility" to 0.0))
            time += 100; continue
          }
          var frame: Bitmap = decoded
          try {
            if (rotation != 0f) frame = Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, Matrix().apply { postRotate(rotation) }, true)
            val image = BitmapImageBuilder(frame).build()
            try {
              val pose = detector.detectForVideo(image, time).landmarks().firstOrNull()
              var angle = 0.0; var visibility = 0.0
              if (pose != null && pose.size >= 29) {
                val left = listOf(23, 25, 27); val right = listOf(24, 26, 28)
                val side = if (left.sumOf { pose[it].visibility().orElse(0f).toDouble() } >= right.sumOf { pose[it].visibility().orElse(0f).toDouble() }) left else right
                val a = pose[side[0]]; val b = pose[side[1]]; val c = pose[side[2]]
                visibility = side.minOf { pose[it].visibility().orElse(0f).toDouble() }
                val ux = (a.x() - b.x()).toDouble() * frame.width; val uy = (a.y() - b.y()).toDouble() * frame.height
                val vx = (c.x() - b.x()).toDouble() * frame.width; val vy = (c.y() - b.y()).toDouble() * frame.height
                val denominator = hypot(ux, uy) * hypot(vx, vy)
                if (denominator > 0) angle = acos(((ux * vx + uy * vy) / denominator).coerceIn(-1.0, 1.0)) * 180 / Math.PI
              }
              samples.add(mapOf("timeMs" to time.toDouble(), "kneeAngle" to angle, "visibility" to visibility))
            } finally { image.close() }
          } finally { if (frame !== decoded) frame.recycle(); decoded.recycle() }
          time += 100
        }
        samples
      } finally { detector?.close(); retriever.release() }
    }
  }
}
