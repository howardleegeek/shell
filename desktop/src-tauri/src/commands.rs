// Shell Tauri Commands

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Command;
use std::sync::Mutex;
use tauri::State;

#[derive(Default)]
pub struct ServerState(pub Mutex<Option<u32>>);

#[derive(Default)]
pub struct McpServerState(pub Mutex<HashMap<String, u32>>);

#[derive(Serialize, Deserialize)]
pub struct CommandResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

#[derive(Serialize, Deserialize)]
pub struct McpServerStatus {
    pub name: String,
    pub status: String, // "running" | "stopped"
    pub pid: Option<u32>,
}

/// Start OpenCode server
#[tauri::command]
pub async fn start_opencode_server(
    port: Option<u16>,
    state: State<'_, ServerState>,
) -> Result<String, String> {
    let port = port.unwrap_or(4096);
    
    // Check if server is already running
    {
        let guard = state.0.lock().map_err(|e| e.to_string())?;
        if guard.is_some() {
            return Err("Server already running".to_string());
        }
    }
    
    // Start opencode serve in background
    let child = Command::new("opencode")
        .args(&["serve", "--port", &port.to_string()])
        .spawn()
        .map_err(|e| format!("Failed to start opencode: {}", e))?;
    
    let pid = child.id();
    
    {
        let mut guard = state.0.lock().map_err(|e| e.to_string())?;
        *guard = Some(pid);
    }
    
    Ok(format!("OpenCode server started on port {}", port))
}

/// Stop OpenCode server
#[tauri::command]
pub async fn stop_opencode_server(state: State<'_, ServerState>) -> Result<String, String> {
    let pid = {
        let mut guard = state.0.lock().map_err(|e| e.to_string())?;
        guard.take()
    };
    
    if let Some(pid) = pid {
        #[cfg(windows)]
        {
            Command::new("taskkill")
                .args(&["/F", "/PID", &pid.to_string()])
                .output()
                .map_err(|e| e.to_string())?;
        }
        
        #[cfg(not(windows))]
        {
            Command::new("kill")
                .arg("-9")
                .arg(pid.to_string())
                .output()
                .map_err(|e| e.to_string())?;
        }
        
        Ok("Server stopped".to_string())
    } else {
        Err("Server not running".to_string())
    }
}

/// Get server status
#[tauri::command]
pub async fn get_server_status(state: State<'_, ServerState>) -> Result<bool, String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    Ok(guard.is_some())
}

/// Run a Web3 command (forge, anchor, hardhat, etc.)
#[tauri::command]
pub async fn run_web3_command(
    tool: String,
    args: Vec<String>,
    cwd: Option<String>,
) -> Result<CommandResult, String> {
    let mut cmd = Command::new(&tool);
    
    if let Some(ref dir) = cwd {
        cmd.current_dir(dir);
    }
    
    cmd.args(&args);
    
    let output = cmd.output().map_err(|e| format!("Failed to run {}: {}", tool, e))?;
    
    Ok(CommandResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    })
}

/// Start an MCP server
#[tauri::command]
pub async fn start_mcp_server(
    name: String,
    command: String,
    args: Vec<String>,
    state: State<'_, McpServerState>,
) -> Result<String, String> {
    let mut cmd = Command::new(&command);
    cmd.args(&args);
    
    // Start in background
    let child = cmd.spawn()
        .map_err(|e| format!("Failed to start MCP server {}: {}", name, e))?;
    
    let pid = child.id();
    
    {
        let mut guard = state.0.lock().map_err(|e| e.to_string())?;
        guard.insert(name.clone(), pid);
    }
    
    Ok(format!("MCP server '{}' started with PID {}", name, pid))
}

/// Stop an MCP server
#[tauri::command]
pub async fn stop_mcp_server(
    name: String,
    state: State<'_, McpServerState>,
) -> Result<String, String> {
    let pid = {
        let mut guard = state.0.lock().map_err(|e| e.to_string())?;
        guard.remove(&name)
    };
    
    if let Some(pid) = pid {
        #[cfg(windows)]
        {
            Command::new("taskkill")
                .args(&["/F", "/PID", &pid.to_string()])
                .output()
                .map_err(|e| e.to_string())?;
        }
        
        #[cfg(not(windows))]
        {
            Command::new("kill")
                .arg("-9")
                .arg(pid.to_string())
                .output()
                .map_err(|e| e.to_string())?;
        }
        
        Ok(format!("MCP server '{}' stopped", name))
    } else {
        Err(format!("MCP server '{}' not running", name))
    }
}

/// Get MCP server status
#[tauri::command]
pub async fn get_mcp_servers_status(
    state: State<'_, McpServerState>,
) -> Result<Vec<McpServerStatus>, String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    
    let statuses: Vec<McpServerStatus> = guard
        .iter()
        .map(|(name, &pid)| McpServerStatus {
            name: name.clone(),
            status: "running".to_string(),
            pid: Some(pid),
        })
        .collect();
    
    Ok(statuses)
}
