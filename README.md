# 🚀 Reddit Clone – DevSecOps Platform on **AWS EKS | Jenkins CI | ArgoCD GitOps | Security Scanning | Observability**

An end-to-end **DevSecOps platform** that demonstrates how to build, secure, deploy, and observe a cloud-native application using **CI/CD, GitOps, Kubernetes, and AWS**.  
This project was built collaboratively and focuses on **production-style architecture and best practices**.

---

## 🧠 Project Overview

This platform automates the full lifecycle of a Reddit Clone application:

- Infrastructure provisioning using **Terraform**
- Secure **CI pipeline** with Jenkins and multiple security gates
- **GitOps-based CD** using ArgoCD
- Deployment on **AWS EKS**
- **Monitoring & observability** with Prometheus and Grafana

Git is used as the **single source of truth**, ensuring consistency, traceability, and automated recovery.

---

## 🧩 Project Structure (Frontend & Backend)

The application is now split into two folders:

- `frontend/` → Next.js UI
- `backend/` → Express API + Prisma

The frontend connects to the backend via environment variables. Use
`NEXT_PUBLIC_API_BASE_URL` (and optionally `API_BASE_URL` for SSR) to point the UI
to the API server.

### Local Development

1. Start the backend API:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm install
   NEXT_PUBLIC_API_BASE_URL="http://localhost:4000" npm run dev
   ```

---

## 🏗️ Architecture Diagram

![DevSecOps Architecture](images/architecture.webp)

**Flow Summary:**

1. Developer commits code to GitHub  
2. Jenkins CI pipeline is triggered  
3. Build, test, and security scans are executed  
4. Docker image is built and pushed  
5. Kubernetes manifests are updated in Git  
6. ArgoCD syncs changes to AWS EKS  
7. Application is monitored via Prometheus & Grafana  
