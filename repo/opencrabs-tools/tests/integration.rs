use serde_json::json;
use opencrabs_tools_web3::{Tool, register_tools};

// Integration-like test to ensure all tools compile and can run in DRY mode
#[test]
fn integration_tools_dry_run() {
    // Ensure dry-run mode to avoid external side effects
    std::env::set_var("OPENCRABS_DRY_RUN", "1");

    let mut registry: Vec<Box<dyn Tool>> = Vec::new();
    register_tools(&mut registry);
    assert!(!registry.is_empty(), "tool registry should be populated");

    // Run each tool with a minimal set of args
    for tool in registry {
        let res = tool.execute(&json!({"path": "."}));
        assert!(res.is_ok(), "tool {} should execute in dry-run", tool.name());
        let v = res.unwrap();
        assert!(v.is_object(), "tool result should be an object");
    }
}
