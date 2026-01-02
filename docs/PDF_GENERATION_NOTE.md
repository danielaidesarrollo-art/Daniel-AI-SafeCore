# PDF Generation Instructions

The official security policy and audit reports are available in Markdown format. To generate signed PDF versions, please run the following commands in your local environment found in the root directory:

```bash
# Install dependencies (if not already done)
npm install

# Generate Security Policy PDF
npx md-to-pdf docs/fail_safe_protocol.md

# Generate Audit Report PDF
npx md-to-pdf docs/reports/Audit_Result_Final.md
```

The PDFs will be generated in the same directories as the source files.
