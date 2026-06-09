"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import type { Application, ApplicationStatus } from "@/types/application";
import { useDroppable } from "@dnd-kit/core";

const STATUS_COLUMNS: ApplicationStatus[] = [
  "Wishlist",
  "Applied",
  "OA",
  "Interview",
  "Offer",
  "Rejected",
];

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}
function PipelineColumn({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div ref={setNodeRef}>
      {children}
    </div>
  );
}

export default function PipelineBoard() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const loadApplications = async (uid: string) => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setItems((data as Application[]) ?? []);
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in");
        return;
      }

      setUserId(user.id);
      await loadApplications(user.id);
      setLoading(false);
    };

    init();
  }, [router]);

  const grouped = useMemo(() => {
    const map: Record<ApplicationStatus, Application[]> = {
      Wishlist: [],
      Applied: [],
      OA: [],
      Interview: [],
      Offer: [],
      Rejected: [],
    };

    for (const item of items) {
      map[item.status].push(item);
    }

    return map;
  }, [items]);

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    if (!userId) return;

    const { error } = await supabase
      .from("applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setError(error.message);
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    console.log("ACTIVE:", event.active.id);
console.log("OVER:", event.over?.id);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const draggedItem = items.find((item) => item.id === activeId);
    if (!draggedItem) return;

    if (STATUS_COLUMNS.includes(overId as ApplicationStatus)) {
      await updateStatus(activeId, overId as ApplicationStatus);
      return;
    }

    const targetItem = items.find((item) => item.id === overId);
    if (!targetItem) return;

    if (targetItem.status !== draggedItem.status) {
      await updateStatus(activeId, targetItem.status);
      return;
    }

    const sameColumnItems = grouped[draggedItem.status];
    const oldIndex = sameColumnItems.findIndex((item) => item.id === activeId);
    const newIndex = sameColumnItems.findIndex((item) => item.id === overId);
    const reordered = arrayMove(sameColumnItems, oldIndex, newIndex);

    const updated = items.filter((item) => item.status !== draggedItem.status);
    setItems([...updated, ...reordered]);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-muted-foreground">Loading pipeline...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Pipeline</h1>
        <p className="mt-2 text-muted-foreground">
          Move applications between stages like Wishlist, Applied, OA, Interview, Offer, and Rejected.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-5 xl:grid-cols-6">
          {STATUS_COLUMNS.map((status) => (
  <PipelineColumn key={status} id={status}>
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">{status}</h2>
                <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                  {grouped[status].length}
                </span>
              </div>

              <SortableContext
                items={grouped[status].map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="min-h-24 space-y-3">
                  {grouped[status].length === 0 ? (
                    <p className="rounded-xl border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                      Drop items here
                    </p>
                  ) : (
                    grouped[status].map((item) => (
                      <PipelineCard
                        key={item.id}
                        item={item}
                        onOpen={() => router.push(`/applications/${item.id}`)}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
                </div>
  </PipelineColumn>
))}
        </div>
      </DndContext>

      <div className="mt-8 rounded-2xl border p-5">
        <p className="text-sm text-muted-foreground">
          Tip: move cards into the right stage to keep your dashboard and analytics meaningful.
        </p>
      </div>
    </main>
  );
}

function PipelineCard({
  item,
  onOpen,
}: {
  item: Application;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-xl border bg-background p-4 shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onOpen}
            className="text-left font-semibold hover:underline"
          >
            {item.company_name}
          </button>
          <p className="mt-1 text-sm text-muted-foreground">{item.role_title}</p>
        </div>
        <span className="rounded-full border px-2 py-1 text-[11px] text-muted-foreground">
          {item.status}
        </span>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        <p>Deadline: {formatDate(item.deadline)}</p>
        <p>Applied: {formatDate(item.application_date)}</p>
      </div>

      {item.notes && (
        <p className="mt-3 line-clamp-2 text-sm text-foreground/90">
          {item.notes}
        </p>
      )}
    </article>
  );
}