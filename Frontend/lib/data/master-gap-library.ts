/**
 * MASTER GAP LIBRARY V1.0
 *
 * This is the "Arsenal of Gaps" - a comprehensive collection of 50+ skills
 * that the default user ABSOLUTELY DOES NOT HAVE in initialMockSkills.
 *
 * These skills are guaranteed to create critical gaps in any job analysis,
 * ensuring the engine never returns "No gaps found" false positives.
 */

export const MASTER_GAP_LIBRARY = [
  // DevOps & Infrastructure as Code (10 skills)
  { name: "Pulumi", category: "Infrastructure as Code", priority: "High", marketDemand: 78 },
  { name: "ArgoCD", category: "GitOps", priority: "High", marketDemand: 81 },
  { name: "Cilium", category: "eBPF Networking", priority: "High", marketDemand: 72 },
  { name: "Crossplane", category: "Cloud Control Planes", priority: "Medium", marketDemand: 68 },
  { name: "Kops", category: "Kubernetes Provisioning", priority: "High", marketDemand: 75 },
  { name: "Operator Framework", category: "Kubernetes Operators", priority: "Medium", marketDemand: 70 },
  { name: "Helm Charts", category: "Kubernetes Packaging", priority: "High", marketDemand: 84 },
  { name: "Consul", category: "Service Mesh", priority: "Medium", marketDemand: 76 },
  { name: "Nomad", category: "Orchestration", priority: "Medium", marketDemand: 71 },
  { name: "Traefik", category: "Reverse Proxy", priority: "Medium", marketDemand: 73 },

  // Enterprise & Specialized Backend (10 skills)
  { name: "gRPC", category: "API Technology", priority: "High", marketDemand: 79 },
  { name: "Apache Solr", category: "Search Platform", priority: "Medium", marketDemand: 66 },
  { name: "RabbitMQ Advanced", category: "Message Broker", priority: "High", marketDemand: 77 },
  { name: "GraphQL Federation", category: "API Architecture", priority: "High", marketDemand: 80 },
  { name: "Protocol Buffers", category: "Serialization", priority: "Medium", marketDemand: 74 },
  { name: "CQRS Pattern", category: "Architecture", priority: "High", marketDemand: 75 },
  { name: "Event Sourcing", category: "Architecture", priority: "High", marketDemand: 76 },
  { name: "Saga Pattern", category: "Distributed Transactions", priority: "Medium", marketDemand: 72 },
  { name: "Outbox Pattern", category: "Event-Driven", priority: "Medium", marketDemand: 70 },
  { name: "Apache Camel", category: "Integration", priority: "Medium", marketDemand: 68 },

  // Cutting-Edge Frontend (8 skills)
  { name: "SvelteKit", category: "Web Framework", priority: "Medium", marketDemand: 71 },
  { name: "Qwik", category: "Web Framework", priority: "Medium", marketDemand: 69 },
  { name: "WebAssembly (WASM)", category: "Web Technology", priority: "High", marketDemand: 78 },
  { name: "Three.js Advanced", category: "3D Graphics", priority: "Medium", marketDemand: 73 },
  { name: "Babylon.js", category: "3D Graphics", priority: "Medium", marketDemand: 70 },
  { name: "Astro Framework", category: "Static Site Generation", priority: "Medium", marketDemand: 72 },
  { name: "Remix Advanced", category: "Full Stack", priority: "Medium", marketDemand: 75 },
  { name: "Lit Framework", category: "Web Components", priority: "Medium", marketDemand: 68 },

  // Data Science & MLOps (10 skills)
  { name: "MLflow Advanced", category: "MLOps", priority: "High", marketDemand: 82 },
  { name: "Kubeflow", category: "MLOps", priority: "High", marketDemand: 79 },
  { name: "Ray Distributed", category: "Distributed Computing", priority: "High", marketDemand: 81 },
  { name: "Hugging Face Transformers", category: "NLP", priority: "High", marketDemand: 84 },
  { name: "LLaMA Fine-tuning", category: "LLM", priority: "High", marketDemand: 85 },
  { name: "Weights & Biases", category: "ML Monitoring", priority: "Medium", marketDemand: 77 },
  { name: "DVC (Data Version Control)", category: "ML Pipeline", priority: "Medium", marketDemand: 74 },
  { name: "Experiment Tracking", category: "MLOps", priority: "Medium", marketDemand: 71 },
  { name: "RAPIDS", category: "GPU Acceleration", priority: "Medium", marketDemand: 75 },
  { name: "Kedro Framework", category: "ML Pipeline", priority: "Medium", marketDemand: 70 },

  // Mobile Development (6 skills)
  { name: "SwiftUI Advanced", category: "iOS Development", priority: "High", marketDemand: 80 },
  { name: "Jetpack Compose", category: "Android Development", priority: "High", marketDemand: 81 },
  { name: "Flutter Advanced", category: "Cross-Platform", priority: "High", marketDemand: 79 },
  { name: "React Native Performance", category: "Mobile", priority: "Medium", marketDemand: 76 },
  { name: "ARKit Advanced", category: "AR/VR", priority: "Medium", marketDemand: 72 },
  { name: "Flutter Riverpod", category: "State Management", priority: "Medium", marketDemand: 73 },

  // Cybersecurity & Compliance (6 skills)
  { name: "Zero Trust Architecture", category: "Security", priority: "High", marketDemand: 83 },
  { name: "eBPF Security Monitoring", category: "Security", priority: "High", marketDemand: 80 },
  { name: "Falco", category: "Runtime Security", priority: "Medium", marketDemand: 76 },
  { name: "SIEM Implementation", category: "Security", priority: "High", marketDemand: 82 },
  { name: "OAuth2 Advanced", category: "Authentication", priority: "Medium", marketDemand: 77 },
  { name: "OpenID Connect", category: "Authentication", priority: "Medium", marketDemand: 75 },
]

export type MasterGapSkill = (typeof MASTER_GAP_LIBRARY)[number]
