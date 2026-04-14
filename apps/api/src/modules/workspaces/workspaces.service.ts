import { Injectable } from "@nestjs/common";

@Injectable()
export class WorkspacesService {
  getDefaultWorkspace() {
    return {
      id: "workspace_demo",
      name: "Acme Engineering",
      slug: "acme-engineering"
    };
  }
}
