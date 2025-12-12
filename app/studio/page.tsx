export default function StudioPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Automation Studio</h1>
      <p className="text-muted-foreground mb-8">
        Configure forms, views, triggers, conditions, actions, approvals, and automations.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <a
          href="/studio/forms"
          className="p-6 border rounded-lg hover:bg-accent transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Forms</h2>
          <p className="text-sm text-muted-foreground">
            Build and configure forms for data entry
          </p>
        </a>

        <a
          href="/studio/views"
          className="p-6 border rounded-lg hover:bg-accent transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Views</h2>
          <p className="text-sm text-muted-foreground">
            Create tables, kanban boards, and reports
          </p>
        </a>

        <a
          href="/studio/triggers"
          className="p-6 border rounded-lg hover:bg-accent transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Triggers</h2>
          <p className="text-sm text-muted-foreground">
            Define when automations should run
          </p>
        </a>

        <a
          href="/studio/conditions"
          className="p-6 border rounded-lg hover:bg-accent transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Conditions</h2>
          <p className="text-sm text-muted-foreground">
            Set up conditional logic rules
          </p>
        </a>

        <a
          href="/studio/actions"
          className="p-6 border rounded-lg hover:bg-accent transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Actions</h2>
          <p className="text-sm text-muted-foreground">
            Define what automations should do
          </p>
        </a>

        <a
          href="/studio/approvals"
          className="p-6 border rounded-lg hover:bg-accent transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Approvals & SLAs</h2>
          <p className="text-sm text-muted-foreground">
            Configure approval workflows and SLA policies
          </p>
        </a>

        <a
          href="/studio/automations"
          className="p-6 border rounded-lg hover:bg-accent transition-colors col-span-2"
        >
          <h2 className="text-xl font-semibold mb-2">Automations</h2>
          <p className="text-sm text-muted-foreground">
            Compose automations from triggers, conditions, and actions
          </p>
        </a>
      </div>
    </div>
  );
}

