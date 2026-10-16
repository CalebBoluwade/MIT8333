import { Card, CardContent } from "@/components/ui/card";
import { RequestForm } from "@/components/requests/request-form";

export const metadata = { title: "New request" };

export default function NewRequest() {
  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Maintenance</p>
        <h1 className="text-2xl font-semibold">Report a problem</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tell us what needs fixing and where. You can follow progress after you submit.</p>
      </div>
      <Card><CardContent className="pt-6"><RequestForm /></CardContent></Card>
    </div>
  );
}
