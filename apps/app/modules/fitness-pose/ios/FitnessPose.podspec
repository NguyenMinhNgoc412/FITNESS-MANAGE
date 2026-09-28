Pod::Spec.new do |s|
  s.name = 'FitnessPose'
  s.version = '1.0.0'
  s.summary = 'On-device pose metrics for FITNESS-MANAGE'
  s.description = 'Processes app-local workout video without network upload.'
  s.license = { :type => 'Proprietary' }
  s.author = 'FITNESS-MANAGE'
  s.homepage = 'https://docs.expo.dev/modules/'
  s.platforms = { :ios => '16.4' }
  s.source = { :path => '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.dependency 'MediaPipeTasksVision', '0.10.21'
  s.source_files = '**/*.swift'
  s.resources = 'Resources/*.task'
end
