use crate::Tool;
use serde_json::{Value, json};
use std::process::Command;
use std::env;

pub struct Web3Detect;

impl Tool for Web3Detect {
    fn name(&self) -> &'static str { "web3_detect" }
    fn description(&self) -> &'static str { "Detect Web3 project type (EVM/Solana)" }
    fn execute(&self, args: &Value) -> anyhow::Result<Value> {
        if env::var("OPENCRABS_DRY_RUN").is_ok() {
            return Ok(json!({"tool":"web3_detect","status":"dry-run"}));
        }
        let path = args.get("path").and_then(|v| v.as_str()).unwrap_or(".");
        let out = Command::new("shell-run").arg("detect").arg("--path").arg(path).output()?;
        let stdout = String::from_utf8_lossy(&out.stdout).to_string();
        let parsed: Value = serde_json::from_str(&stdout).unwrap_or_else(|_| json!({"error":"invalid-output","output": stdout}));
        Ok(parsed)
    }
}
