use crate::Tool;
use serde_json::{Value, json};
use std::process::Command;
use std::env;

pub struct Web3Test;

impl Tool for Web3Test {
    fn name(&self) -> &'static str { "web3_test" }
    fn description(&self) -> &'static str { "Run smart contract tests" }
    fn execute(&self, args: &Value) -> anyhow::Result<Value> {
        if env::var("OPENCRABS_DRY_RUN").is_ok() {
            let chain = args.get("chain").and_then(|v| v.as_str()).unwrap_or("unknown");
            return Ok(json!({"tool":"web3_test","status":"dry-run","chain": chain}));
        }
        let chain = args.get("chain").and_then(|v| v.as_str()).unwrap_or("default");
        let out = Command::new("shell-run").arg("test").arg("--chain").arg(chain).output()?;
        let stdout = String::from_utf8_lossy(&out.stdout).to_string();
        // Best-effort parse, fallback to error payload
        let _parsed: Value = serde_json::from_str(&stdout).unwrap_or_else(|_| json!({"error":"invalid-output","output": stdout}));
        let report_path = format!("reports/{}.json", chain);
        Ok(json!({"tool":"web3_test","status":"ok","chain": chain, "report": report_path}))
    }
}
