use crate::Tool;
use serde_json::{Value, json};
use std::process::Command;
use std::env;

pub struct Web3Build;

impl Tool for Web3Build {
    fn name(&self) -> &'static str { "web3_build" }
    fn description(&self) -> &'static str { "Build Web3 project" }
    fn execute(&self, args: &Value) -> anyhow::Result<Value> {
        if env::var("OPENCRABS_DRY_RUN").is_ok() {
            let chain = args.get("chain").and_then(|v| v.as_str()).unwrap_or("unknown");
            return Ok(json!({"tool":"web3_build","status":"dry-run","chain": chain}));
        }
        let chain = args.get("chain").and_then(|v| v.as_str()).unwrap_or("default");
        let out = Command::new("shell-run").arg("build").arg("--chain").arg(chain).output()?;
        let stdout = String::from_utf8_lossy(&out.stdout).to_string();
        let parsed: Value = serde_json::from_str(&stdout).unwrap_or_else(|_| json!({"error":"invalid-output","output": stdout}));
        Ok(parsed)
    }
}
