# PR/FAQ — Network Control, Observability, and Automation Platform for Containerlab-Based Multi-Vendor Labs
## Press Release

**Leonardo Furtado announces a new network control, observability, and automation platform designed to bring production-minded engineering practices to advanced Containerlab-based network labs**

Dublin, Ireland — Leonardo Furtado today announced the development of a new platform that transforms advanced network labs from isolated topology exercises into reusable engineering systems for observability, policy visibility, validation, and controlled automation.

Built as a separate platform alongside a growing library of Containerlab labs, the system is designed to help network engineers and infrastructure teams move beyond “the lab came up” toward a more rigorous model of engineering. Instead of treating labs as disposable protocol demos, the platform treats them as environments where operators can collect evidence, understand state, compare intended and observed behavior, monitor health, inspect policy outcomes, and safely evolve toward workflow-driven automation.

The initial implementation is Nokia-first and targets a sophisticated SR-MPLS service provider lab, but the platform is intentionally architected to expand over time to other vendors such as Juniper, Cisco, and beyond. The system combines a custom backend and operator-facing WebUI with Prometheus, Grafana, and a bounded OpenDaylight integration to create a practical, extensible platform for network state collection, protocol observability, policy inventory, and later dry-run and safe action workflows.

The platform is designed to address a recurring problem in network engineering: many labs teach configuration syntax, but few teach how real systems are observed, reasoned about, validated, and safely changed. In production environments, engineers must understand not just protocol state, but the relationship between intended design, actual behavior, visibility gaps, tooling boundaries, and operational confidence. This project brings those concerns into the lab from the beginning.

The platform’s first capabilities focus on read-only visibility and normalized state. Engineers can inspect device inventory, topology, SR policy inventory, platform health, and service metrics through a structured WebUI and Grafana-based observability layer. Over time, the platform will evolve toward dry-run capabilities, capability-aware validation, and tightly bounded safe workflows, helping engineers build both technical depth and operational judgment.

“Too many labs stop at ‘it works,’” said Leonardo Furtado, creator of the project. “Real engineering starts when you ask what the system is doing, what you can prove, what changed, what is degraded, what the blast radius is, and whether you trust the next step. This platform is being built to make labs feel more like real engineering systems.”

The platform is being developed as a reusable peer project inside the broader Containerlab repository and is intended to support multiple topologies over time rather than being tied to one lab. It uses management-plane-first integration, gNMI-first observed-state principles, vendor-neutral internal models, and clear adapter boundaries to preserve future extensibility and avoid architectural lock-in.

Initial development focuses on:

- A separate platform Containerlab topology
- A custom backend API as the platform brain
- A custom WebUI as the operator-facing product
- Prometheus for metrics and time-series observability
- Grafana for operational dashboards and drilldowns
- A gNMI-first collector for observed-state gathering and normalization
- Postgres for durable platform state
- OpenDaylight for bounded controller/protocol support where it provides leverage

The platform is currently in architecture-first development and will be delivered in phases, starting with structure, observability, read-only visibility, and normalized models before moving into more advanced workflow logic.

---

# FAQ

## 1. What is the product?

This project is a **network control, observability, and automation platform** that lives alongside a set of advanced Containerlab-based network labs.

This is not a single lab. It is not just a bundle of dashboards, an SDN controller, or a collection of stitched-together scripts.

It is a reusable platform that collects and consolidates real, observed network state, then normalizes device, topology, and policy information so it can be understood and used consistently. Instead of hiding this behind closed systems, it exposes read-only visibility through APIs and a web-based interface, making it easier for operators and tools to see what is actually happening in the network.

From an operations perspective, the platform is built to provide practical observability by integrating with Prometheus and Grafana, so teams can monitor behavior and trends over time. It also uses OpenDaylight, but deliberately and boundedly, focusing on protocol- and controller-oriented use cases rather than treating it as a catch-all.

Over time, the goal is for this platform to move beyond visibility into more advanced workflows such as validation, dry runs, and eventually safe, automated actions. It begins with a strong Nokia focus but is intentionally designed to scale to support Juniper and, later, a broader set of multi-vendor environments.

---

## 2. Who is the customer?

The primary customer is the serious network engineer or infrastructure engineer who wants more than protocol demos and screenshots. This person is looking for realistic, engineering-grade material that mirrors the complexity and trade-offs of real networks.

In practice, this includes service provider engineers working on large-scale networks, transport engineers focused on moving data reliably and efficiently, and segment routing specialists designing modern traffic-engineering solutions. It also includes data center and fabric engineers focused on underlay and overlay design, as well as automation-minded network teams that want to treat the network as code and make changes in a repeatable, testable way.

Reliability-focused infrastructure engineers are also a key part of this audience. They want to understand failure modes, operational risks, and how to design systems that behave predictably under stress. Finally, there are advanced learners who are not satisfied with toy topologies. They want labs that reflect real engineering concerns, real constraints, and real trade-offs.

There is also an important internal customer: the future operator of the platform itself. This is the engineer who wants to ask better questions about the system, validate assumptions instead of relying on hunches, reduce guesswork during troubleshooting, and build a more disciplined operational model over time.

---

## 3. What problem does this solve?

Most network labs are optimized for **setup**, not for **engineering**.

They usually help answer:

- Can I bring the topology up?
- Can I configure the protocol?
- Does basic reachability work?

But production engineering requires much more. Engineers need to answer:

- What is the observed state of the system?
- What is intended versus what is actually happening?
- What is healthy, degraded, unknown, or unsupported?
- What changed?
- What can I validate?
- What is the blast radius of a failure or planned change?
- What does the system believe about policies, topology, and services?
- How do I make automation trustworthy rather than dangerous?

Without a platform like this, advanced labs often remain fragmented:

- Topology files live in one place
- Configs live in another
- Protocol state is checked manually
- Dashboards are ad hoc
- Controller experimentation is separate
- There is no normalized internal model
- No durable product-like layer exists above the lab

This project solves that by turning the lab into a **coherent engineering system**.

---

## 4. What business need is being met?

The business need is to achieve better network engineering outcomes by enabling faster understanding, more reliable experimentation, stronger visibility, and safer evolution.

For teams and organizations, this means spending less time trying to understand how systems behave and relying less on manual, CLI-only inspection. It builds greater operational confidence and makes it easier for people to get up to speed with complex architectures. It also supports creating more reusable lab environments for training, testing, and design validation, providing a more realistic path from lab experimentation to production-grade engineering thinking. Over time, this becomes a platform foundation for future automation and more controlled, repeatable workflows.

These capabilities are particularly important in modern environments, where networks are becoming increasingly programmable, span multiple domains, are driven by policy, generate rich telemetry, and are more operationally complex.

---

## 5. Why not just use Grafana and Prometheus alone?

Because Grafana and Prometheus solve only part of the problem.

They are excellent tools for metrics, dashboards, trends, drill-downs, and overall operational visualization. They give you strong observability capabilities and make it easy to see what’s happening in your systems.

However, on their own, they don’t provide what a full platform needs. They don’t provide a platform-owned internal truth model or normalized, multi-vendor inventory and policy models. They also don’t handle workflow logic or intent, and they aren’t aware of capabilities in a way that lets them validate actions or configurations. They don’t manage durable application state, operator product flows, or the kind of auditability you need for future dry-run and change workflows.

In other words, Grafana should be the observability layer—an important part of the stack—but not the entire product.

---

## 6. Why not just use OpenDaylight alone?

OpenDaylight gives us strong controller and protocol leverage, but it isn’t the finished operator-facing product this project needs.

In this platform, we use OpenDaylight for well-defined, bounded controller and protocol functions, for maintaining controller-side state, and for protocol plumbing in the places where it clearly gives us an advantage.

However, it’s not the right place to centralize the overall product experience or the full normalized domain model. It’s also not where we want to put workflow orchestration, the operator-facing web UI, or the product-owned source of truth. Likewise, we don’t want to push all observability concerns or the gNMI-first observed-state model into OpenDaylight.

By design, OpenDaylight is deliberately bounded in this architecture. We use it where it helps, but we do not allow it to dominate or define the entire platform.

---

## 7. Why build a custom backend and WebUI?

This project needs a real product layer.

The backend is the platform's brain. It owns the internal models, the API contracts, and the workflow scaffolding. It’s also responsible for reconciliation logic, capability awareness, integration boundaries, and the durable behavior of the application.

The WebUI is the operator-facing product. It’s where engineers will inspect inventory, topology, and policy state, and where they’ll be able to view capabilities. Over time, it will also become the place where they compare the intended and observed states, review dry-run outputs, and interact with controlled workflows.

Without these two layers working together, the project is just a collection of tools instead of a coherent platform.

---

## 8. What are the main engineering gains?

The engineering gains are substantial.

### Better visibility

The platform creates a consistent, read‑only layer across all the key aspects of your environment. It provides a unified view of your devices, network topology, and policy inventory. It also surfaces both platform and service health, along with observed-state signals, in a single, coherent model.

### Better structure

Instead of relying on scattered configurations and ad hoc scripts, the project brings a more intentional structure. It defines a separate platform topology, sets explicit boundaries around each service, and clarifies how data flows between them. It also introduces normalized models and reusable contracts, enabling different parts of the system to interact consistently and predictably.

### Better reuse

Because the platform isn’t tied to a single lab, it can grow and evolve over time. It can later support multiple labs, accommodate different architectures, and integrate with various vendors. This flexibility also opens up several possible growth paths as needs change.

### Better evolution

A phased model lets the project grow in a controlled, sustainable way. It starts with simple scaffolding, then moves into basic read-only visibility. From there, we can add richer normalization, followed by a dry-run mode to test changes safely. Finally, we introduce bounded, safe workflows—so the system becomes more powerful over time without collapsing under premature complexity.

---

## 9. What are the operational gains?

Operationally, the platform helps engineers move away from manual spot-checking and toward a way of working that starts with clear evidence and a shared understanding.

It makes troubleshooting and inspecting the system state more straightforward and gives teams better awareness of overall platform health. Because information is captured consistently, work becomes more repeatable and auditable, and the architecture is easier to keep aligned with agreed-upon standards. It also lays the groundwork for later phases, such as formal validation and more controlled change workflows.

In day-to-day terms, this means engineers don’t have to keep answering questions by running ad-hoc CLI commands, relying on memory, taking screenshots, digging through scattered notes, or writing one-off scripts. Instead, the platform provides a coherent place to get reliable answers.

---

## 10. What is the business impact?

The business impact is strongest in four areas:

### 1. Faster engineering understanding

Engineers can understand complex network state faster and more consistently.

### 2. Better training and onboarding

The platform turns advanced labs into reusable engineering environments, improving training quality and accelerating learning.

### 3. Stronger experimentation quality

Architectural testing becomes more disciplined and observable, reducing shallow or misleading lab conclusions.

### 4. Foundation for safer automation

By creating normalized models, observability, and explicit boundaries first, the platform lays the groundwork for safer, more trustworthy future automation.

In the long term, this type of platform can reduce engineering effort, shorten investigation time, improve design review quality, and enable higher-confidence change practices.

---

## 11. What are the biggest challenges this project addresses?

This project addresses real, day-to-day challenges labs face. Many teams struggle with limited visibility into what’s actually happening in their environments and with a fragmented state across multiple tools. Too often, engineers rely on manual CLI checks to assess basic conditions, without durable internal models of the lab. That makes it hard to reuse work across different lab scenarios and encourages premature automation efforts that aren't backed up. As organizations add multi-vendor support, the architecture can drift in ways that are hard to control or even notice. Underlying all of this is a persistent gap between how protocols are configured on paper and the engineering maturity required to run them reliably in practice.

---

## 12. What are the major risks?

The main risks are architectural, not just technical.

### Risk 1: tool sprawl

Without discipline, the project could become a pile of unrelated components.

**Mitigation:** clear boundaries between backend, WebUI, ODL, Grafana, Prometheus, and collector.

### Risk 2: ODL over-centralization

There is a temptation to make OpenDaylight the entire architecture.

**Mitigation:** explicitly bounded ODL role.

### Risk 3: Grafana becoming the product

Dashboards can look impressive and distract from the need for a real product layer.

**Mitigation:** WebUI remains the operator-facing product.

### Risk 4: Nokia lock-in

Starting Nokia-first can accidentally hardcode vendor assumptions.

**Mitigation:** vendor-neutral models and explicit adapter boundaries.

### Risk 5: workflow scope too early

It is easy to jump into “change the network” features too early.

**Mitigation:** read-only maturity first, dry-run later, bounded safe actions only after foundations are real.

---

## 13. What is the high-level design?

At a high level, the platform consists of five layers.

### 1. Network plane

This is the actual lab topology, which is organized into several key areas. First, we have the routers themselves and the underlying transport they rely on. On top of that, we’re using SR-MPLS as the main forwarding technology. The lab also includes different services built over this infrastructure, along with a range of failure scenarios to validate behavior under stress. Altogether, this forms the complete architecture under test. Future labs will include other architectures and technologies, such as EVPN-VXLAN and SRv6.

### 2. Controller/protocol plane

This is where OpenDaylight participates in a bounded way to leverage the controller/protocol.

### 3. Observability plane

This includes Prometheus for collecting and storing metrics, Grafana for visualizing them, and a set of service-level metrics that give us insight into how each component is performing. On top of that, we provide curated dashboards and operational drilldowns so teams can quickly understand system behavior and troubleshoot issues when they arise.

### 4. Product/orchestration plane

This is our custom backend, built to handle everything behind the scenes. It powers our APIs, manages the data models, and connects to the external services we integrate with. It also provides the scaffolding for our workflows and keeps the core business logic reliable and long‑lasting.

### 5. Experience plane

This is the custom WebUI. It includes rich product pages, intuitive product navigation, and clear visibility surfaces that make it easy to understand what’s going on. Looking ahead, it will also support dry-run and workflow views to help you test and refine processes before going live.

---

## 14. What are the major components?

### Platform topology

A separate Containerlab topology that runs the platform services.

### gNMI collector

A first-class collector service responsible for observed-state gathering and normalization.

### Backend API

The main application service and the brain of the platform.

### WebUI

The operator-facing product.

### Postgres

Durable application storage.

### Prometheus

Metrics and time-series engine.

### Grafana

Observability dashboards and drilldowns.

### OpenDaylight

A bounded controller/protocol support component.

---

## 15. What is the proposed tech stack?

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic
- PostgreSQL

### Frontend

- TypeScript
- React
- Next.js or equivalent structured React application architecture

### Collector

- Python
- vendor adapter modules
- normalization/mapping layers
- Prometheus metrics exposure

### Observability

- Prometheus
- Grafana

### Controller/protocol integration

- OpenDaylight
- bounded backend integration modules

### Deployment/runtime

- Containerlab
- Linux-kind service containers
- separate platform topology
- management-plane-first lab integration

---

## 16. How do the components integrate?

The integration model is deliberately simple at first.

### Observed-state path

Devices expose state through the collector path. The collector normalizes data and feeds the backend. The backend exposes platform-owned APIs. Prometheus scrapes metrics from services. Grafana visualizes those metrics. The WebUI consumes backend APIs.

### Controller/protocol path

OpenDaylight exposes controller-side or protocol-related inputs. The backend consumes selected ODL-derived information through bounded adapters. That data becomes one input into the platform, not the entire truth.

### Durable state path

The backend writes durable application data to Postgres:

- Inventory snapshots
- Topology records
- Policy records
- Workflow and audit structures later

### Product path

The WebUI consumes stable API contracts from the backend and presents product-oriented views.

---

## 17. Why is management-plane-first integration the default?

Because it is simpler, clearer, and more reproducible.

The platform is a separate Containerlab topology from the labs. Using management-plane-first integration:

- Reduces coupling
- Simplifies deployment
- Lowers operational complexity
- Makes the platform easier to reuse across multiple labs

It is the right default until a specific use case justifies deeper coupling.

---

## 18. What is the phased rollout plan?

### Phase 1

- Repo structure
- Platform topology
- Service boundaries
- Docs
- Observability scaffolding
- Backend/frontend/collector skeletons

### Phase 2

- Read-only APIs
- First collector-to-backend path
- First normalized models in use
- First WebUI read-only pages
- First real Prometheus/Grafana signals

### Phase 3

- Richer normalized models
- Stronger policy/topology detail
- Bounded ODL-backed read integration
- Capability matrix becomes more real

### Phase 4

- Dry-run scaffolding
- Validation-oriented workflows
- Stronger intended vs observed views

### Phase 5

- One narrowly scoped safe action workflow
- Strong auditability
- Post-check validation
- Rollback semantics where feasible

---

## 19. What does success look like?

Success is not just that the platform exists.

Success means that engineers can actually inspect meaningful network state through a real, usable product layer, not by digging through tools and one-off scripts. It means the architecture stays clean rather than becoming a tangle of special cases, and the platform remains reusable across labs rather than being tightly coupled to a single environment.

It also means our observability is real and actionable, not just cosmetic dashboards that look impressive but don’t help us debug or understand what’s going on. The internal models need to be stable enough that we can evolve the system without constantly breaking things. We should be able to add new workflow logic over time without redesigning everything from scratch.

And finally, success means we can still grow into a multi-vendor world without painting ourselves into a corner.

---

## 20. Why now?

The complexity of modern network engineering has outgrown the old lab model. Engineers no longer just need to understand protocols; they also need hands-on experience with visibility, interpreting network state, understanding policies, recognizing automation limits, and building confidence through validation patterns. This project is designed to address that gap directly.

---

## 21. What is the one-sentence vision?

**Build a reusable platform that makes advanced Containerlab-based network labs behave more like real engineering systems: observable, explainable, extensible, and eventually safe to automate.**