"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { insertCategorySchema, CATEGORY_VISIBILITY } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { tailwindColorMap, tailwindColors } from "@/lib/colors";



const formSchema = insertCategorySchema.extend({
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated?: (category: any) => void;
}

export function AddCategoryModal({
  isOpen,
  onClose,
  onCategoryCreated,
}: AddCategoryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "white",
      visibility: "offline",
    },
  });

  const selectedVisibility = form.watch("visibility");

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const visibility = data.visibility ?? "offline";
      const payload: any = {
        ...data,
        visibility,
        // Online categories require Super Admin approval; default offline is approved.
        approvalStatus: visibility === "online" ? "pending" : "approved",
      };

      // If user is not super_admin, scope the category to their store and prevent direct online visibility
      if (user?.role !== "super_admin") {
        payload.storeId = user?.storeId ?? payload.storeId ?? null;
        if (visibility === "online") {
          payload.approvalStatus = "pending";
          payload.visibility = "offline";
        }
      }

      const response = await apiRequest("POST", "/api/categories", payload);
      return await response.json();
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: (newCategory?.approval_status ?? newCategory?.approvalStatus) === "pending" ? "Category created (pending approval)" : "Success",
        description: (newCategory?.approval_status ?? newCategory?.approvalStatus) === "pending" ? "Category created and pending Super Admin approval." : "Category created successfully",
      });
      form.reset();
      onCategoryCreated?.(newCategory);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-add-category">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Create a new product category to organize your inventory.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter category name"
                      {...field}
                      data-testid="input-category-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Enter category description"
                      {...field}
                      data-testid="textarea-category-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          {v === "online" ? "Online (requires Super Admin approval)" : "Offline (POS only)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedVisibility === "online" && user?.role !== "super_admin" && (
                    <p className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded mt-2">
                      Selecting "Online" will create a pending approval request and the category will remain offline until a Super Admin approves it.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

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
                data-testid="button-cancel-add-category"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="button-submit-add-category"
              >
                {isSubmitting ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
