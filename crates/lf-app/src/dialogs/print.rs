//! Print Export & Cloudinary (`dxeuzdwkz` / `Event schedule`) Direct Download Dialog (`dialogs/print.rs`)

use crate::print_job::StudioPrintJob;

#[derive(Debug, Clone)]
pub struct CloudinaryExportConfig {
    pub cloud_name: String,
    pub upload_preset: String,
    pub use_fl_attachment: bool,
}

impl Default for CloudinaryExportConfig {
    fn default() -> Self {
        Self {
            cloud_name: String::from("dxeuzdwkz"),
            upload_preset: String::from("Event schedule"),
            use_fl_attachment: true,
        }
    }
}

pub struct PrintExportDialog {
    pub job: StudioPrintJob,
    pub cloudinary: CloudinaryExportConfig,
    pub export_pdf: bool,
}

impl PrintExportDialog {
    pub fn new(job: StudioPrintJob) -> Self {
        Self {
            job,
            cloudinary: CloudinaryExportConfig::default(),
            export_pdf: false,
        }
    }

    pub fn upload_endpoint(&self) -> String {
        format!(
            "https://api.cloudinary.com/v1_1/{}/image/upload",
            self.cloudinary.cloud_name
        )
    }
}
