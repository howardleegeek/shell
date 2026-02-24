use crate::Tool;
use serde_json::{Value, json};
use std::process::Command;
use std::env;

pub struct Web3Deploy;

impl Tool for Web3Deploy {
    fn name(&self) -> &'static str { "web3_deploy" }
    fn description(&self) -> &'static str { "Deploy Web3 project to testnet" }
    fn execute(&self, args: &Value) -> anyhow::Result<Value> {
        if env::var("OPENCRABS_DRY_RUN").is_ok() {
            let network = args.get("network").and_then(|v| v.as_str()).unwrap_or("testnet");
            return Ok(json!({"tool":"web3_deploy","status":"dry-run","network": network}));
        }
        let network = args.get("network").and_then(|v| v.as_str()).unwrap_or("testnet");
        let out = Command::new("shell-run").arg("deploy").arg("--network").arg(network).output()?;
        let stdout = String::from_utf8_lossy(&out.stdout).to_string();
        let parsed: Value = serde_json::from_str(&stdout).unwrap_or_else(|_| json!({"error":"invalid-output","output": stdout}));
        Ok(parsed)
    }
}
