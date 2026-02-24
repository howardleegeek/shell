use crate::Tool;
use serde_json::{Value, json};
use std::fs;
use std::path::Path;

pub struct Web3Report;

impl Tool for Web3Report {
    fn name(&self) -> &'static str { "web3_report" }
    fn description(&self) -> &'static str { "Read reports/*.json and return structured summary" }
    fn execute(&self, _args: &Value) -> anyhow::Result<Value> {
        // Read all JSON files under reports/ and return their parsed content
        let mut reports: Vec<Value> = Vec::new();
        let reports_dir = Path::new("reports");
        if reports_dir.is_dir() {
            for entry in fs::read_dir(reports_dir)? {
                let entry = entry?;
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("json") {
                    if let Ok(s) = fs::read_to_string(&path) {
                        if let Ok(v) = serde_json::from_str::<Value>(&s) {
                            reports.push(v);
                        } else {
                            reports.push(json!({"path": path.display().to_string(), "error": "invalid_json"}));
                        }
                    }
                }
            }
        }
        Ok(json!({"tool":"web3_report","reports": reports}))
    }
}
