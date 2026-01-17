// macOS-specific imports for emoji picker
#[cfg(target_os = "macos")]
use cocoa::appkit::NSApp;
#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};

/// Opens the native macOS emoji/character picker
#[tauri::command]
fn open_emoji_picker() {
    #[cfg(target_os = "macos")]
    {
        unsafe {
            let app = NSApp();
            let _: () = msg_send![app, orderFrontCharacterPalette: cocoa::base::nil];
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![open_emoji_picker])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
