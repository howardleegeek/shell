use serde_json::Value;
use anyhow::Result;

// Public trait definition to be used by all tools in this crate.
pub trait Tool: Send + Sync {
    fn name(&self) -> &'static str;
    fn description(&self) -> &'static str;
    fn execute(&self, args: &Value) -> Result<Value>;
}

// Re-export tool implementations for registry wiring
pub mod web3_detect;
pub mod web3_test;
pub mod web3_build;
pub mod web3_deploy;
pub mod web3_report;

pub use self::web3_detect::Web3Detect;
pub use self::web3_test::Web3Test;
pub use self::web3_build::Web3Build;
pub use self::web3_deploy::Web3Deploy;
pub use self::web3_report::Web3Report;

// Register all web3 tools into a provided registry
pub fn register_tools(registry: &mut Vec<Box<dyn Tool>>) {
    registry.push(Box::new(Web3Detect));
    registry.push(Box::new(Web3Test));
    registry.push(Box::new(Web3Build));
    registry.push(Box::new(Web3Deploy));
    registry.push(Box::new(Web3Report));
}
