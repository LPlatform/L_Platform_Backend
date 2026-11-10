# Code execution security status

The evaluator in `src/services/evaluator.service.ts` can launch submitted programs as child processes when called. A timeout and temporary working directory do not isolate a process from the API container, its filesystem, network, operating-system resources, or process credentials. It is not a secure sandbox. The submission route does not call it. The API image also omits Python, Java, and C++ toolchains so they are not available in the running API container.

The submission API therefore stores submissions as `PENDING` and returns HTTP 202. It does not call the evaluator or launch student code. Evaluation remains unavailable until a separately deployed execution service provides a verifiable isolation boundary.

Before enabling evaluation, the execution design must use a dedicated worker with no API or database credentials and execute each submission in an ephemeral OS/container sandbox with non-root identity, read-only base filesystem, no network, strict CPU/memory/process/output limits, syscall restrictions, and teardown after each run. The API must exchange bounded, authenticated job/result messages with that worker. The isolation design requires adversarial tests and independent review; a separate Compose service by itself is not proof of isolation.
