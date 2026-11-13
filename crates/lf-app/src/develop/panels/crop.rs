//! Develop Crop & Official Background Swatch Panel (`develop/panels/crop.rs`)
//! Provides searchable Category 1, 2, and 3 presets, official background swatches,
//! and Exam Name & Date Slate controls.

use lf_catalog::print::{OFFICIAL_PRESETS, OfficialPhotoPreset};

#[derive(Debug, Clone)]
pub struct BackgroundSwatch {
    pub id: &'static str,
    pub label: &'static str,
    pub hex: &'static str,
}

pub const OFFICIAL_SWATCHES: &[BackgroundSwatch] = &[
    BackgroundSwatch { id: "pure_white", label: "Pure White", hex: "#FFFFFF" },
    BackgroundSwatch { id: "off_white", label: "Off-White / Cream", hex: "#F7F7F2" },
    BackgroundSwatch { id: "light_grey", label: "Light Grey", hex: "#E5E7EB" },
    BackgroundSwatch { id: "indonesia_red", label: "Indonesia Red", hex: "#D9232A" },
    BackgroundSwatch { id: "philippines_blue", label: "Philippines / Indonesia Blue", hex: "#0052B4" },
    BackgroundSwatch { id: "thailand_light_blue", label: "Thailand Light Blue", hex: "#CFE8FF" },
];

pub struct CropPanelState {
    pub selected_preset_id: String,
    pub selected_bg_hex: String,
    pub show_biometric_guides: bool,
    pub enable_name_date_slate: bool,
    pub candidate_name: String,
    pub capture_date: String,
    pub attach_signature_box: bool,
}

impl Default for CropPanelState {
    fn default() -> Self {
        let default_preset = &OFFICIAL_PRESETS[0];
        Self {
            selected_preset_id: default_preset.id.to_string(),
            selected_bg_hex: default_preset.default_bg_hex.to_string(),
            show_biometric_guides: true,
            enable_name_date_slate: default_preset.requires_name_date_slate,
            candidate_name: String::from("AARAV SHARMA"),
            capture_date: String::from("15-11-2026"),
            attach_signature_box: default_preset.supports_signature_box,
        }
    }
}

impl CropPanelState {
    pub fn active_preset(&self) -> &'static OfficialPhotoPreset {
        OFFICIAL_PRESETS
            .iter()
            .find(|p| p.id == self.selected_preset_id)
            .unwrap_or(&OFFICIAL_PRESETS[0])
    }
}
