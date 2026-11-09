# API contract publishing

The backend owns the API contract. Generate OpenAPI from the application, validate the document, and publish it as a versioned immutable artifact tied to a backend release. Web and desktop consumers pin a specific contract version, regenerate clients, and run compatibility tests. Breaking changes require explicit approval and a new compatible contract version. Never share backend source or allow consumers to copy models manually.

No API application, OpenAPI generation command, artifact registry or consumer automation exists yet. Add those when the application is established; publishing is not operational today.
