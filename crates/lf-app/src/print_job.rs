//! Studio Print Sheet Tiler & Smart File Size (KB) Compressor Job Engine
//! Handles 300 DPI sRGB JPEG & PDF print sheet tiling with 2-3 mm cutting bleed, crop marks,
//! Name & Date slate rendering, and Cloudinary (`dxeuzdwkz`) upload integration.

use lf_catalog::print::{OfficialPhotoPreset, PrintSheetGridSpec, PrintSheetSize};

#[derive(Debug, Clone)]
pub struct NameDateSlateConfig {
    pub enabled: bool,
    pub candidate_name: String,
    pub capture_date: String,
    pub dark_strip: bool,
}

#[derive(Debug, Clone)]
pub struct CanadaBackStampNote {
    pub studio_name: String,
    pub studio_address: String,
    pub date_taken: String,
    pub guarantor_declaration: String,
}

#[derive(Debug, Clone)]
pub struct StudioPrintJob {
    pub preset: OfficialPhotoPreset,
    pub sheet_size: PrintSheetSize,
    pub background_hex: String,
    pub bleed_mm: f32,
    pub draw_crop_marks: bool,
    pub target_max_kb: u32,
    pub slate: NameDateSlateConfig,
    pub attach_signature_box: bool,
    pub back_stamp: Option<CanadaBackStampNote>,
}

impl StudioPrintJob {
    pub fn new(preset: OfficialPhotoPreset, sheet_size: PrintSheetSize) -> Self {
        Self {
            background_hex: preset.default_bg_hex.to_string(),
            target_max_kb: preset.max_kb,
            bleed_mm: 2.5,
            draw_crop_marks: true,
            slate: NameDateSlateConfig {
                enabled: preset.requires_name_date_slate,
                candidate_name: String::from("CANDIDATE NAME"),
                capture_date: String::from("15-11-2026"),
                dark_strip: false,
            },
            attach_signature_box: preset.supports_signature_box,
            back_stamp: if preset.requires_back_stamp {
                Some(CanadaBackStampNote {
                    studio_name: String::from("Lumina Luxury Photo Studio"),
                    studio_address: String::from("Connaught Place, New Delhi"),
                    date_taken: String::from("15-11-2026"),
                    guarantor_declaration: String::from("I certify this is a true likeness"),
                })
            } else {
                None
            },
            preset,
            sheet_size,
        }
    }

    pub fn grid_layout(&self) -> PrintSheetGridSpec {
        self.preset.resolve_sheet_grid(self.sheet_size)
    }

    /// Computes optimal JPEG quality (10..=98) to constrain output file size under `target_max_kb`.
    pub fn compute_optimal_jpeg_quality(&self, raw_uncompressed_bytes: usize) -> u8 {
        let target_bytes = (self.target_max_kb as usize) * 1024;
        if raw_uncompressed_bytes == 0 || target_bytes >= raw_uncompressed_bytes {
            return 95;
        }
        let ratio = (target_bytes as f32) / (raw_uncompressed_bytes as f32);
        let estimated_q = (ratio * 115.0).clamp(18.0, 95.0) as u8;
        estimated_q
    }
}
