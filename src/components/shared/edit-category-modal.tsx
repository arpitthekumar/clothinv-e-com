"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema, CATEGORY_VISIBILITY } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { tailwindColorMap } from "@/lib/colors";

interface EditCategoryModalProps {
  open: boolean;
  onClose: () => void;
  category: {
    id: string;
    name: string;
    description?: string | null;
    color: string;
    visibility?: string;
    approval_status?: string;
    approvalStatus?: string;
  } | null;
}

const schema = insertCategorySchema;

export function EditCategoryModal({
  open,
  onClose,
  category,
}: EditCategoryModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const handleClose = () => {
    form.reset();
    onClose();
  };

  const approvalStatus = category?.approvalStatus ?? category?.approval_status ?? "approved";
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    values: {
      name: category?.name ?? "",
      description: category?.description ?? "",
      color: category?.color ?? "white",
      visibility: (category?.visibility === "online" ? "online" : "offline") as "online" | "offline",
    },
  });

  // React-hook-form watch to show inline messages when admin selects online
  const selectedVisibility = form.watch("visibility");

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!category) return; // TS safe

    // When merchant/admin sets visibility to "online", request Super Admin approval (pending).
    const visibility = values.visibility ?? "offline";
    const payload: any = {
      id: category.id,
      ...values,
      approvalStatus: visibility === "online" ? "pending" : "approved",
    };

    // If a non-super_admin requested online, ensure visibility stays offline until approved
    if (visibility === "online" && user?.role !== "super_admin") {
      payload.visibility = "offline";
    }

    const res = await apiRequest("PUT", "/api/categories", payload);

    if (!res.ok) {
      const error = await res.json();
      toast({
        title: "Error",
        description: error.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: payload.approvalStatus === "pending" ? "Category update pending" : "Category Updated",
      description: payload.approvalStatus === "pending"
        ? `"${values.name}" update submitted for Super Admin approval.`
        : `"${values.name}" updated successfully.`,
    });

    queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    onClose();
  }; 

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
<DialogHeader>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogDescription>
          Update your category details. Setting visibility to &quot;Online&quot; submits a request for Super Admin approval.
        </DialogDescription>
      </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {approvalStatus === "pending" && (
              <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded">
                Pending approval for online visibility.
              </p>
            )}
            {selectedVisibility === "online" && user?.role !== "super_admin" && (
              <p className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded">
                Selecting "Online" will submit a request for Super Admin approval and the category will remain offline until approved.
              </p>
            )}
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Category name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      {...field}
                      placeholder="Optional description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Visibility: online requires Super Admin approval */}
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select
                    value={field.value ?? "offline"}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORY_VISIBILITY.map((v) => (
                        <SelectItem key={v} value={v} disabled={v === "online" && user?.role === "employee"}>
                          {v === "online" ? "Online (request approval)" : "Offline (POS only)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>

                  <Select
                    value={field.value || "white"}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-category-color">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-4 w-4 rounded-full border ${
                              tailwindColorMap[field.value || "white"].bg
                            }`}
                          />
                          <span className="capitalize">
                            {field.value || "white"}
                          </span>
                        </div>
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {Object.keys(tailwindColorMap).map((color) => (
                        <SelectItem
                          key={color}
                          value={color}
                          className="pl-8 flex items-center gap-2 capitalize"
                        >
                          <div
                            className={`h-4 w-4 rounded-full border ${tailwindColorMap[color].bg}`}
                          />
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end  space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel-add-product"
              >
                Cancel
              </Button>{" "}
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
