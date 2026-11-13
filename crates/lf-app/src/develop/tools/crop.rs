//! Interactive Biometric Crop & Pinch-to-Zoom Tool (`develop/tools/crop.rs`)

#[derive(Debug, Clone, Copy)]
pub struct BiometricCropTransform {
    pub zoom: f32,
    pub pan_x_pct: f32,
    pub pan_y_pct: f32,
    pub aspect_ratio: f32,
}

impl Default for BiometricCropTransform {
    fn default() -> Self {
        Self {
            zoom: 1.15,
            pan_x_pct: 0.0,
            pan_y_pct: 0.0,
            aspect_ratio: 1.0, // 51x51 mm default
        }
    }
}

impl BiometricCropTransform {
    pub fn set_dimensions_mm(&mut self, width_mm: f32, height_mm: f32, include_signature_box: bool) {
        let effective_h = if include_signature_box {
            height_mm + 15.0
        } else {
            height_mm
        };
        self.aspect_ratio = width_mm / effective_h.max(1.0);
    }

    pub fn apply_pinch_zoom(&mut self, delta_scale: f32) {
        self.zoom = (self.zoom * delta_scale).clamp(0.8, 2.5);
    }
}
