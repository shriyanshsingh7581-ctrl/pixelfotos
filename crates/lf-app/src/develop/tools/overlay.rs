//! Biometric Head, Crown-to-Chin & Eye-Line Overlay Guides (`develop/tools/overlay.rs`)
//! Calibrated for USA/India (51x51 mm), Schengen/ICAO (35x45 mm), UK (35x45 mm),
//! Canada (50x70 mm), and China (33x48 mm).

use lf_catalog::print::BiometricStandard;

#[derive(Debug, Clone, Copy)]
pub struct BiometricOverlayMetrics {
    pub standard: BiometricStandard,
    pub crown_top_ratio: f32,
    pub chin_bottom_ratio: f32,
    pub eye_line_ratio_from_top: f32,
    pub head_width_ratio: f32,
    pub head_height_mm_label: &'static str,
    pub eye_line_from_bottom_mm_label: &'static str,
    pub top_margin_mm_label: &'static str,
}

impl BiometricOverlayMetrics {
    pub fn for_standard(standard: BiometricStandard) -> Self {
        match standard {
            BiometricStandard::UsIndiaSquare51x51 => Self {
                standard,
                crown_top_ratio: 0.12,
                chin_bottom_ratio: 0.78,
                eye_line_ratio_from_top: 0.40,
                head_width_ratio: 0.56,
                head_height_mm_label: "25 - 35 mm (50% - 69%)",
                eye_line_from_bottom_mm_label: "28 - 35 mm from bottom edge",
                top_margin_mm_label: "4 - 8 mm above hair",
            },
            BiometricStandard::IcaoSchengen35x45 => Self {
                standard,
                crown_top_ratio: 0.09,
                chin_bottom_ratio: 0.84,
                eye_line_ratio_from_top: 0.42,
                head_width_ratio: 0.64,
                head_height_mm_label: "32 - 36 mm (70% - 80% vertical fill)",
                eye_line_from_bottom_mm_label: "20 - 30 mm from bottom edge",
                top_margin_mm_label: "3 - 5 mm above crown",
            },
            BiometricStandard::Uk35x45 => Self {
                standard,
                crown_top_ratio: 0.11,
                chin_bottom_ratio: 0.82,
                eye_line_ratio_from_top: 0.43,
                head_width_ratio: 0.62,
                head_height_mm_label: "29 - 34 mm",
                eye_line_from_bottom_mm_label: "20 - 29 mm from bottom edge",
                top_margin_mm_label: "4 - 6 mm above crown",
            },
            BiometricStandard::Canada50x70 => Self {
                standard,
                crown_top_ratio: 0.14,
                chin_bottom_ratio: 0.64,
                eye_line_ratio_from_top: 0.38,
                head_width_ratio: 0.54,
                head_height_mm_label: "31 - 36 mm",
                eye_line_from_bottom_mm_label: "Centered vertically (35 - 42 mm)",
                top_margin_mm_label: "7 mm minimum top margin",
            },
            BiometricStandard::China33x48 => Self {
                standard,
                crown_top_ratio: 0.09,
                chin_bottom_ratio: 0.78,
                eye_line_ratio_from_top: 0.42,
                head_width_ratio: 0.58,
                head_height_mm_label: "28 - 33 mm (Width: 15 - 22 mm)",
                eye_line_from_bottom_mm_label: "21 - 28 mm from bottom edge",
                top_margin_mm_label: "3 - 5 mm clearance above hair",
            },
            BiometricStandard::PanStampGeneral => Self {
                standard,
                crown_top_ratio: 0.12,
                chin_bottom_ratio: 0.80,
                eye_line_ratio_from_top: 0.42,
                head_width_ratio: 0.58,
                head_height_mm_label: "65% - 75% vertical fill",
                eye_line_from_bottom_mm_label: "55% - 62% from bottom edge",
                top_margin_mm_label: "3 - 6 mm top margin",
            },
        }
    }
}
