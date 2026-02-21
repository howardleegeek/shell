// Shell - Web3 Dev Studio
// Tauri Backend

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Manager;

mod commands;
use commands::{McpServerState, ServerState};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(ServerState::default())
        .manage(McpServerState::default())
        .setup(|app| {
            // Get the main window
            let window = app.get_window("main").unwrap();
            
            // Set window title
            window.set_title("Shell - Web3 Dev Studio").unwrap();
            
            println!("Shell Web3 Dev Studio starting...");
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::start_opencode_server,
            commands::stop_opencode_server,
            commands::run_web3_command,
            commands::get_server_status,
            commands::start_mcp_server,
            commands::stop_mcp_server,
            commands::get_mcp_servers_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
