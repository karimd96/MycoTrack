import CrudPanel from "@/components/CrudPanel";
import UsersPanel from "@/components/UsersPanel";
import { useAuth } from "@/context/AuthContext";

const SPECIES_FIELDS = [
  { name: "scientific_name", label: "Scientific name", required: true },
  { name: "common_name", label: "Common name" },
  { name: "category", label: "Category" },
  { name: "notes", label: "Notes", type: "textarea" },
];
const LOCATION_FIELDS = [
  { name: "name", label: "Name", required: true },
  { name: "type", label: "Type (lab / incubator / fruiting chamber)" },
  { name: "description", label: "Description", type: "textarea" },
];
const RECIPE_FIELDS = [
  { name: "name", label: "Name", required: true },
  { name: "type", label: "Type (agar / grain / bulk)" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "instructions", label: "Instructions", type: "textarea" },
];

export function SpeciesPage() {
  const { canWrite, isAdmin } = useAuth();
  return (
    <CrudPanel
      resource="species"
      title="Species"
      fields={SPECIES_FIELDS}
      columns={[
        { key: "scientific_name", label: "Scientific name" },
        { key: "common_name", label: "Common name" },
        { key: "category", label: "Category" },
      ]}
      canWrite={canWrite}
      canDelete={isAdmin}
    />
  );
}

export function LocationsPage() {
  const { canWrite, isAdmin } = useAuth();
  return (
    <CrudPanel
      resource="locations"
      title="Location"
      fields={LOCATION_FIELDS}
      columns={[
        { key: "name", label: "Name" },
        { key: "type", label: "Type" },
        { key: "description", label: "Description" },
      ]}
      canWrite={canWrite}
      canDelete={isAdmin}
    />
  );
}

export function RecipesPage() {
  const { canWrite, isAdmin } = useAuth();
  return (
    <CrudPanel
      resource="recipes"
      title="Recipe"
      fields={RECIPE_FIELDS}
      columns={[
        { key: "name", label: "Name" },
        { key: "type", label: "Type" },
        { key: "description", label: "Description" },
      ]}
      canWrite={canWrite}
      canDelete={isAdmin}
    />
  );
}

export function UsersPage() {
  return <UsersPanel />;
}
