/**
 * Camera debugging utility
 * Call this function to check camera availability and permissions
 */

export const debugCamera = async () => {
  console.log("=== Camera Debug Info ===");
  
  // Check if mediaDevices API is available
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error("❌ MediaDevices API not available");
    console.log("Make sure you're using HTTPS or localhost");
    return {
      available: false,
      error: "MediaDevices API not available"
    };
  }
  
  console.log("✅ MediaDevices API is available");
  
  // Check for cameras
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    console.log(`📹 Found ${videoDevices.length} camera(s):`);
    videoDevices.forEach((device, index) => {
      console.log(`  ${index + 1}. ${device.label || `Camera ${index + 1}`} (${device.deviceId})`);
    });
    
    if (videoDevices.length === 0) {
      console.warn("⚠️ No cameras found");
      return {
        available: false,
        error: "No cameras found"
      };
    }
  } catch (err) {
    console.error("❌ Error enumerating devices:", err);
  }
  
  // Test camera access
  try {
    console.log("🔍 Testing camera access...");
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: "environment" } 
    });
    
    console.log("✅ Camera access granted!");
    console.log("Stream tracks:", stream.getTracks().length);
    
    // Stop the test stream
    stream.getTracks().forEach(track => {
      console.log(`  Stopping track: ${track.kind} - ${track.label}`);
      track.stop();
    });
    
    return {
      available: true,
      error: null
    };
  } catch (err) {
    console.error("❌ Camera access error:", err);
    console.log("Error name:", err.name);
    console.log("Error message:", err.message);
    
    let userMessage = "";
    switch (err.name) {
      case "NotAllowedError":
        userMessage = "Camera permission denied. Please allow camera access in your browser settings.";
        break;
      case "NotFoundError":
        userMessage = "No camera found on this device.";
        break;
      case "NotReadableError":
        userMessage = "Camera is already in use by another application.";
        break;
      case "OverconstrainedError":
        userMessage = "Camera doesn't support the requested constraints.";
        break;
      case "SecurityError":
        userMessage = "Camera access blocked due to security settings. Make sure you're using HTTPS or localhost.";
        break;
      default:
        userMessage = `Camera error: ${err.message}`;
    }
    
    return {
      available: false,
      error: userMessage
    };
  }
};

// Auto-run on import in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    debugCamera();
  }, 1000);
}
