//! Responsive Desktop & Mobile Print Studio Workbench UI (`print_ui.rs`)
//! Implements the split-screen Desktop workbench and touch-friendly Mobile tabbed drawer
//! while preserving the Bottom Navigation Bar layout.

use crate::print_job::StudioPrintJob;
use lf_catalog::print::{OFFICIAL_PRESETS, PresetCategory, PrintSheetSize};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PrintUiTab {
    InteractiveWorkbench,
    OfficialSizeReferenceGuide,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MobileDrawerStep {
    PresetSelector,
    BiometricCropAndSlate,
    PrintSheetAndKbExport,
    SizeReferenceCards,
}

pub struct PrintStudioUiState {
    pub active_tab: PrintUiTab,
    pub mobile_step: MobileDrawerStep,
    pub search_query: String,
    pub category_filter: Option<PresetCategory>,
    pub active_job: StudioPrintJob,
}

impl Default for PrintStudioUiState {
    fn default() -> Self {
        Self {
            active_tab: PrintUiTab::InteractiveWorkbench,
            mobile_step: MobileDrawerStep::BiometricCropAndSlate,
            search_query: String::new(),
            category_filter: None,
            active_job: StudioPrintJob::new(
                OFFICIAL_PRESETS[0].clone(),
                PrintSheetSize::Sheet4x6In,
            ),
        }
    }
}
