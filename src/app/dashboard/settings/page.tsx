"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { apiGet, apiPutJson, apiPostJson, apiDelete } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Shield,
  Server,
  Loader2,
  Lock,
  Phone,
  Mail,
  Building,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Bell,
  Settings,
  MoreVertical,
  Star,
  CreditCard,
  Eye,
  MessageSquare,
  Monitor,
  Moon,
  Sun,
  LayoutDashboard,
  ClipboardList,
  Calendar,
  FolderOpen,
  HelpCircle,
  Users,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string; // e.g., "Resident"
  propertyId: string;
  isPrimary: boolean;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  relation: string; // e.g., "Spouse", "Other"
}

export default function SettingsPage() {
  const { data: session, update }: any = useSession();
  const { toast } = useToast();

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  // --- Fetch Contacts ---

  const {
    data: contactList = [],
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["myContacts"],
    queryFn: async () => {
      const res = await apiGet<Contact[]>("/users/me/contacts");
      return res || [];
    },
    enabled: !!session?.user,
  });

  // --- Mutations ---
  const { mutate: createContact } = useMutation({
    mutationFn: async (data: any) => {
      return await apiPostJson("/users/me/contacts", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Contact added successfully." });
      refetch();
      setIsAddContactOpen(false);
      setEditingContact(null);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: updateContact } = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiPutJson(`/users/me/contacts/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Contact updated successfully." });
      refetch();
      setIsAddContactOpen(false);
      setEditingContact(null);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteContact } = useMutation({
    mutationFn: async (id: string) => {
      return await apiDelete(`/users/me/contacts/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Contact deleted." });
      refetch();
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (session?.user) {
      const userPrimaryContact: Contact = {
        id: session.user.id,
        name: session.user.name || "Primary User",
        email: session.user.email || "",
        phone: session.user.phone || "",
        role: "Resident",
        propertyId: session.user.unit_number || "UNIT-101",
        isPrimary: true,
        address: {
          street: "123 HOA Lane", // Mock address (could be fetched from backend if we stored it on user)
          city: "Springfield",
          state: "IL",
          zip: "62704",
        },
        relation: "Self",
      };
      // Merge primary user contact with fetched other contacts
      // Only set if not loading to avoid flickering
      if (!isLoading) {
        const others = contactList.map((c: any) => ({
          ...c,
          role: c.relation, // mapping back
          propertyId: session.user.unit_number || "UNIT-101", // assuming contacts live in same unit for now
        }));
        setContacts([userPrimaryContact, ...others]);
      }
    }
  }, [session, contactList, isLoading]);

  const primaryContact = contacts.find(
    (c) => c.isPrimary && c.id === session?.user?.id,
  );
  // Note: Backend might allow marking an "Other" contact as is_primary=true for emergency purposes,
  // but for this UI, "Primary Contact" card is strictly the logged-in user.
  // "Other Contacts" are the list from the DB.

  // Filter out the main user from "Other Contacts" list visually
  const otherContacts = contacts.filter((c) => c.id !== session?.user?.id);

  const handleSaveContact = (contact: Contact) => {
    // Check if we are creating or updating
    // If contact has a numeric/UUID id that exists in our db list, it's an update.
    // If it's a new entry (we might need a flag or check ID format), create.

    // Simplification: if we opened the dialog with an existing contact, we edit it.

    if (editingContact && editingContact.id) {
      // Update
      updateContact({
        id: editingContact.id,
        data: {
          name: contact.name,
          relation: contact.relation,
          email: contact.email,
          phone: contact.phone,
          is_primary: contact.isPrimary,
          address: contact.address,
        },
      });
    } else {
      // Create
      createContact({
        name: contact.name,
        relation: contact.relation,
        email: contact.email,
        phone: contact.phone,
        is_primary: contact.isPrimary,
        address: contact.address,
      });
    }
  };

  const handleUpdateContact = (updatedContact: Contact) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === updatedContact.id ? updatedContact : c)),
    );
    if (updatedContact.isPrimary && updatedContact.id === session?.user?.id) {
      // If primary user contact is updated, also update session
      update({
        ...session,
        user: {
          ...session?.user,
          email: updatedContact.email,
          phone: updatedContact.phone,
          // Potentially update address fields if they were part of session
        },
      });
    }
  };

  const handleMakePrimary = (id: string) => {
    const contact = contacts.find((c) => c.id === id);
    if (contact) {
      updateContact({
        id: contact.id,
        data: {
          name: contact.name,
          relation: contact.relation,
          email: contact.email,
          phone: contact.phone,
          is_primary: true,
          address: contact.address,
        },
      });
    }
  };

  const handleDeleteContact = (id: string) => {
    deleteContact(id);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-2 max-w-7xl mx-auto">
      {/* Settings Header with Gradient */}
      <div className="relative">
        {/* Decorative gradient blur */}
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -z-10" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Settings className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Settings
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Account
              </span>
              <span className="text-foreground"> Settings</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your profile, security, and preferences
            </p>
          </div>

          <ContactDialog
            open={isAddContactOpen}
            onOpenChange={(open) => {
              setIsAddContactOpen(open);
              if (!open) setEditingContact(null);
            }}
            contact={editingContact}
            onSave={handleSaveContact}
            unitNumber={session?.user?.unit_number || "UNIT-101"}
          />
        </div>
      </div>

      <Tabs defaultValue="contact" className="space-y-6">
        <div className="sticky top-2 z-40 bg-background/95 backdrop-blur-xl py-2 px-2 border rounded-2xl shadow-xl mb-4 mx-1">
          <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl overflow-x-auto scrollbar-hide h-auto border-none shadow-none">
            <TabsTrigger
              value="contact"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 text-xs md:text-sm py-2 px-5 whitespace-nowrap font-medium"
            >
              Contact Info
            </TabsTrigger>
            <TabsTrigger
              value="login"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 text-xs md:text-sm py-2 px-5 whitespace-nowrap font-medium"
            >
              Login Info
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 text-xs md:text-sm py-2 px-5 whitespace-nowrap font-medium"
            >
              Account Preferences
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="contact" className="space-y-4 pt-2">
          {primaryContact && (
            <PrimaryContactCard
              contact={primaryContact}
              onUpdate={handleUpdateContact}
            />
          )}
          <OtherContactsCard
            contacts={otherContacts}
            onMakePrimary={handleMakePrimary}
            onDelete={handleDeleteContact}
            onEdit={(c) => {
              setEditingContact(c);
              setIsAddContactOpen(true);
            }}
            onAdd={() => {
              setEditingContact(null);
              setIsAddContactOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="login" className="space-y-4 pt-2">
          <LoginDetailsCard />
          <ChangePasswordCard />
          <TwoFactorAuthCard />
          <SecurityHistoryCard />
          <SystemInfoSection />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4 pt-2">
          <ThemePreferencesCard />
          <NotificationsCard />
          <GeneralPreferencesCard />
          <CommunicationPreferencesCard />
          <PrivacySettingsCard />
          <AutopaySettingsCard />
          <PropertySection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PrimaryContactCard({
  contact,
  onUpdate,
}: {
  contact: Contact;
  onUpdate: (c: Contact) => void;
}) {
  const { data: session, update }: any = useSession();
  const { toast } = useToast();

  const [editMode, setEditMode] = useState<
    "none" | "address" | "phone" | "email"
  >("none");
  const [loading, setLoading] = useState(false);

  // Temporary state for editing
  const [tempAddress, setTempAddress] = useState({
    ...contact.address,
    propertyId: contact.propertyId,
  });
  const [tempPhone, setTempPhone] = useState({
    label: contact.relation,
    number: contact.phone,
  });
  const [tempEmail, setTempEmail] = useState({
    label: contact.relation,
    address: contact.email,
  });

  useEffect(() => {
    setTempAddress({ ...contact.address, propertyId: contact.propertyId });
    setTempPhone({ label: contact.relation, number: contact.phone });
    setTempEmail({ label: contact.relation, address: contact.email });
  }, [contact]);

  // Sync session data
  useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await apiGet<any>("/auth/me");
      if (res) {
        const updatedContact = { ...contact };
        let changed = false;
        if (res.phone && res.phone !== contact.phone) {
          updatedContact.phone = res.phone;
          changed = true;
        }
        if (res.email && res.email !== contact.email) {
          updatedContact.email = res.email;
          changed = true;
        }
        if (changed) {
          onUpdate(updatedContact);
        }
      }
      return res;
    },
    enabled: !!session && contact.id === session.user.id, // Only sync for the primary user's contact
  });

  const handleSaveAddress = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    const updatedContact = {
      ...contact,
      address: {
        street: tempAddress.street,
        city: tempAddress.city,
        state: tempAddress.state,
        zip: tempAddress.zip,
      },
      propertyId: tempAddress.propertyId,
    };
    onUpdate(updatedContact);
    setEditMode("none");
    setLoading(false);
    toast({ title: "Success", description: "Address updated successfully" });
  };

  const handleSavePhone = async () => {
    if (!tempPhone.number) {
      toast({
        title: "Error",
        description: "Phone number is required",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const userId = session?.user?.id;
      if (userId && contact.id === userId) {
        // Only update backend if it's the actual user's primary contact
        await apiPutJson(`/users/${userId}`, { phone: tempPhone.number });
        await update({
          ...session,
          user: { ...session?.user, phone: tempPhone.number },
        });
      }
      const updatedContact = {
        ...contact,
        phone: tempPhone.number,
        relation: tempPhone.label,
      };
      onUpdate(updatedContact);
      setEditMode("none");
      toast({ title: "Success", description: "Phone updated successfully" });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to update phone",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!tempEmail.address || !tempEmail.address.includes("@")) {
      toast({
        title: "Error",
        description: "Valid email is required",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const userId = session?.user?.id;
      if (userId && contact.id === userId) {
        // Only update backend if it's the actual user's primary contact
        await apiPutJson(`/users/${userId}`, { email: tempEmail.address });
        await update({
          ...session,
          user: { ...session?.user, email: tempEmail.address },
        });
      }
      const updatedContact = {
        ...contact,
        email: tempEmail.address,
        relation: tempEmail.label,
      };
      onUpdate(updatedContact);
      setEditMode("none");
      toast({ title: "Success", description: "Email updated successfully" });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to update email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-blue-600/5 to-purple-600/5">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Primary Contact Info
            </span>
          </CardTitle>
          <CardDescription>
            Default contact details used by the HOA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x">
            {/* Column 1: Address */}
            <div className="flex flex-col gap-2 p-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground font-semibold">
                  Mailing Address
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setTempAddress({
                      ...contact.address,
                      propertyId: contact.propertyId,
                    });
                    setEditMode("address");
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-sm space-y-1 mt-1">
                <p className="font-medium">{contact.propertyId}</p>
                <p>{contact.address.street}</p>
                <p>
                  {contact.address.city}, {contact.address.state}{" "}
                  {contact.address.zip}
                </p>
              </div>
            </div>

            {/* Column 2: Phone */}
            <div className="flex flex-col gap-2 p-2 md:pl-6">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground font-semibold">
                  Phone
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setTempPhone({
                      label: contact.relation,
                      number: contact.phone,
                    });
                    setEditMode("phone");
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-sm space-y-1 mt-1">
                <p className="font-medium text-xs uppercase text-muted-foreground tracking-wider">
                  {contact.relation}
                </p>
                <p className="text-base">{contact.phone || "Not provided"}</p>
              </div>
            </div>

            {/* Column 3: Email */}
            <div className="flex flex-col gap-2 p-2 md:pl-6">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground font-semibold">
                  Email
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setTempEmail({
                      label: contact.relation,
                      address: contact.email,
                    });
                    setEditMode("email");
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-sm space-y-1 mt-1">
                <p className="font-medium text-xs uppercase text-muted-foreground tracking-wider">
                  {contact.relation}
                </p>
                <p className="text-base truncate" title={contact.email}>
                  {contact.email}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Address Dialog */}
      <Dialog
        open={editMode === "address"}
        onOpenChange={(open) => !open && setEditMode("none")}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Mailing Address</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Property ID</Label>
              <Input
                value={tempAddress.propertyId}
                onChange={(e) =>
                  setTempAddress({ ...tempAddress, propertyId: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Street Address</Label>
              <Input
                value={tempAddress.street}
                onChange={(e) =>
                  setTempAddress({ ...tempAddress, street: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-2">
                <Label>City</Label>
                <Input
                  value={tempAddress.city}
                  onChange={(e) =>
                    setTempAddress({ ...tempAddress, city: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>State</Label>
                <Input
                  value={tempAddress.state}
                  onChange={(e) =>
                    setTempAddress({ ...tempAddress, state: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>ZIP</Label>
                <Input
                  value={tempAddress.zip}
                  onChange={(e) =>
                    setTempAddress({ ...tempAddress, zip: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMode("none")}>
              Cancel
            </Button>
            <Button onClick={handleSaveAddress} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Phone Dialog */}
      <Dialog
        open={editMode === "phone"}
        onOpenChange={(open) => !open && setEditMode("none")}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Phone Number</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Label (e.g. Mobile, Work)</Label>
              <Input
                value={tempPhone.label}
                onChange={(e) =>
                  setTempPhone({ ...tempPhone, label: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Phone Number</Label>
              <Input
                value={tempPhone.number}
                onChange={(e) =>
                  setTempPhone({ ...tempPhone, number: e.target.value.replace(/\D/g, '') })
                }
                maxLength={15}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMode("none")}>
              Cancel
            </Button>
            <Button onClick={handleSavePhone} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Email Dialog */}
      <Dialog
        open={editMode === "email"}
        onOpenChange={(open) => !open && setEditMode("none")}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Email Address</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Label (e.g. Email)</Label>
              <Input
                value={tempEmail.label}
                onChange={(e) =>
                  setTempEmail({ ...tempEmail, label: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Email Address</Label>
              <Input
                value={tempEmail.address}
                onChange={(e) =>
                  setTempEmail({ ...tempEmail, address: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMode("none")}>
              Cancel
            </Button>
            <Button onClick={handleSaveEmail} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OtherContactsCard({
  contacts,
  onMakePrimary,
  onDelete,
  onEdit,
  onAdd,
}: {
  contacts: Contact[];
  onMakePrimary: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (c: Contact) => void;
  onAdd: () => void;
}) {
  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b bg-gradient-to-r from-primary/5 via-blue-600/5 to-purple-600/5 gap-4">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span>Other Contact Info</span>
          </CardTitle>
          <CardDescription>
            Alternate addresses, phones, or emails linked to your properties.
          </CardDescription>
        </div>
        <Button
          onClick={onAdd}
          className="w-full sm:w-auto bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Contact Info
        </Button>
      </CardHeader>
      <CardContent>
        {contacts.length > 0 ? (
          <div className="grid gap-4">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-gradient-to-br from-card to-muted/10 hover:shadow-md hover:border-primary/30 transition-all duration-300"
              >
                <div className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{c.name}</p>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {c.propertyId}
                    </Badge>
                    {c.isPrimary && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {c.relation} • {c.phone} • {c.email}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onMakePrimary(c.id)}>
                      <Star className="mr-2 h-4 w-4" /> Make Primary
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(c)}>
                      <Edit2 className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(c.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No other contacts added.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContactDialog({
  open,
  onOpenChange,
  contact,
  onSave,
  unitNumber,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onSave: (c: Contact) => void;
  unitNumber: string;
}) {
  const isEditing = !!contact?.id; // Check for contact.id to determine if editing existing
  const [formData, setFormData] = useState<Contact>({
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "Resident",
    propertyId: unitNumber,
    isPrimary: false,
    address: { street: "", city: "", state: "", zip: "" },
    relation: "Other",
  });

  useEffect(() => {
    if (contact && contact.id) {
      // If editing an existing contact
      setFormData(contact);
    } else {
      // If adding a new contact
      setFormData({
        id: "", // Will be assigned on save if new
        name: "",
        email: "",
        phone: "",
        role: "Resident",
        propertyId: unitNumber,
        isPrimary: false,
        address: { street: "", city: "", state: "", zip: "" },
        relation: "Other",
      });
    }
  }, [contact, unitNumber, open]);

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Contact" : "Add Contact Information"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update contact details."
              : "Add emergency or alternate contact details."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Full Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value.replace(/[^a-zA-Z\s'-]/g, '') })
                }
                placeholder="Contact Name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Relation</Label>
              <Input
                value={formData.relation}
                onChange={(e) =>
                  setFormData({ ...formData, relation: e.target.value.replace(/[^a-zA-Z\s'-]/g, '') })
                }
                placeholder="e.g. Spouse"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Property ID</Label>
              <Select
                value={formData.propertyId}
                onValueChange={(v) =>
                  setFormData({ ...formData, propertyId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={unitNumber || "UNIT-101"}>
                    {unitNumber || "UNIT-101"}
                  </SelectItem>
                  <SelectItem value="UNIT-205">UNIT-205 (Mock)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 flex flex-row items-center justify-between border p-3 rounded-md">
              <div className="space-y-0.5">
                <Label>Mark as Primary</Label>
                <p className="text-xs text-muted-foreground">
                  This will replace the current primary contact.
                </p>
              </div>
              <Switch
                checked={formData.isPrimary}
                onCheckedChange={(c) =>
                  setFormData({ ...formData, isPrimary: c })
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Contact Details</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="1234567890"
                    className="flex-1"
                    maxLength={15}
                  />
                  <Select defaultValue="Mobile">
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mobile">Mobile</SelectItem>
                      <SelectItem value="Home">Home</SelectItem>
                      <SelectItem value="Work">Work</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Email Address</Label>
                <Input
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Address</Label>
            <div className="grid gap-2">
              <Label>Street Address</Label>
              <Input
                value={formData.address.street}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value },
                  })
                }
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-2">
                <Label>City</Label>
                <Input
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>State</Label>
                <Input
                  value={formData.address.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>ZIP</Label>
                <Input
                  value={formData.address.zip}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, zip: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? "Save Changes" : "Add Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PropertySection() {
  const { data: session }: any = useSession();
  const roles: string[] = session?.roles ?? [];
  const isAdmin = roles.some((r: string) => ["ADMIN", "BOARD_ADMIN", "BOARD", "BOARD_MEMBER", "HOA_BOARD_MEMBER"].includes(r));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" /> Unit Information
          </CardTitle>
          <CardDescription>Details about your residence.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Community
              </Label>
              <p className="font-medium mt-1">
                {session?.tenant_name || "HOA Community"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Unit Number
              </Label>
              <p className="font-medium mt-1 text-2xl">
                {session?.user?.unit_number || "N/A"}
              </p>
            </div>
            {isAdmin && session?.tenant_slug && (
              <div className="col-span-2 pt-2 border-t mt-2">
                <Label className="text-primary text-xs uppercase tracking-wide font-bold">
                  Community Code
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-xl bg-primary/10 px-3 py-1 rounded border border-primary/20 text-primary">
                    {session.tenant_slug}
                  </p>
                  <p className="text-[10px] text-muted-foreground max-w-[200px]">
                    Share this code with residents so they can join your community.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Roles & Permissions
          </CardTitle>
          <CardDescription>
            Your access level within the community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {roles.length > 0 ? (
              roles.map((role) => (
                <Badge key={role} variant="secondary" className="px-3 py-1">
                  {role}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">
                No roles assigned
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoginDetailsCard() {
  const { data: session }: any = useSession();
  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-blue-600/5 to-purple-600/5">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <span>Login Details</span>
        </CardTitle>
        <CardDescription>Your account credentials.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Username</Label>
            <div className="flex items-center justify-between border p-3 rounded-md bg-muted/50">
              <span className="font-medium">
                {session?.user?.name || "Not set"}
              </span>
              <Badge variant="outline" className="text-xs">
                Read-only
              </Badge>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Email Address</Label>
            <div className="flex items-center justify-between border p-3 rounded-md bg-muted/50">
              <span className="font-medium">
                {session?.user?.email || "Not set"}
              </span>
              <Badge variant="outline" className="text-xs">
                Primary
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TwoFactorAuthCard() {
  const [enabled, setEnabled] = useState(false); // Mock state

  return (
    <Card className="border-border/50 shadow-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-to-r from-primary/5 via-blue-600/5 to-purple-600/5">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account.
          </CardDescription>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {enabled ? (
            <div className="flex items-center gap-2 text-green-600">
              <Shield className="h-4 w-4" /> 2FA is currently enabled using
              Authenticator App.
            </div>
          ) : (
            <p>
              Protect your account by requiring a code from your authenticator
              app in addition to your password.
            </p>
          )}
        </div>
        {enabled && (
          <div className="mt-4">
            <Button variant="outline" size="sm">
              Manage 2FA Settings
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SecurityHistoryCard() {
  // Mock Data
  const history = [
    {
      id: 1,
      event: "Login",
      device: "Chrome on Windows",
      location: "Springfield, IL",
      date: new Date().toISOString(),
    },
    {
      id: 2,
      event: "Password Changed",
      device: "Chrome on Windows",
      location: "Springfield, IL",
      date: new Date(Date.now() - 86400000).toISOString(),
    }, // Yesterday
    {
      id: 3,
      event: "Login",
      device: "Safari on iPhone",
      location: "Chicago, IL",
      date: new Date(Date.now() - 172800000).toISOString(),
    }, // 2 days ago
  ];

  return (
    <Card className="border-border/50 shadow-lg overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-blue-600/5 to-purple-600/5">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" /> Security History
        </CardTitle>
        <CardDescription>Recent activity on your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.event}</TableCell>
                <TableCell>{item.device}</TableCell>
                <TableCell>{item.location}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {new Date(item.date).toLocaleDateString()}{" "}
                  {new Date(item.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SystemInfoSection() {
  const { data: session }: any = useSession();
  return (
    <Card className="border-border/50 shadow-lg overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-blue-600/5 to-purple-600/5">
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" /> System Info
        </CardTitle>
        <CardDescription>Technical details for support.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>User ID</Label>
          <code className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
            {session?.user?.id}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}

function ThemePreferencesCard() {
  const { setTheme, theme } = useTheme();

  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-blue-600/5 to-purple-600/5">
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" /> Appearance
        </CardTitle>
        <CardDescription>
          Customize the look and feel of the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div
            className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${theme === "light" ? "border-primary" : ""}`}
            onClick={() => setTheme("light")}
          >
            <Sun className="mb-3 h-6 w-6" />
            <span className="text-sm font-medium">Light</span>
          </div>
          <div
            className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${theme === "dark" ? "border-primary" : ""}`}
            onClick={() => setTheme("dark")}
          >
            <Moon className="mb-3 h-6 w-6" />
            <span className="text-sm font-medium">Dark</span>
          </div>
          <div
            className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${theme === "system" ? "border-primary" : ""}`}
            onClick={() => setTheme("system")}
          >
            <Monitor className="mb-3 h-6 w-6" />
            <span className="text-sm font-medium">System</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationsCard() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-blue-600/5 to-purple-600/5">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" /> Notification Settings
        </CardTitle>
        <CardDescription>Choose how you want to be notified.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between border p-3 rounded-md">
          <div className="space-y-0.5">
            <Label className="text-base">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive updates via email.
            </p>
          </div>
          <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
        </div>
        <div className="flex items-center justify-between border p-3 rounded-md">
          <div className="space-y-0.5">
            <Label className="text-base">SMS Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive updates via text message.
            </p>
          </div>
          <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
        </div>
        <div className="flex items-center justify-between border p-3 rounded-md">
          <div className="space-y-0.5">
            <Label className="text-base">Push Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive updates on your device.
            </p>
          </div>
          <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
        </div>
      </CardContent>
    </Card>
  );
}

function GeneralPreferencesCard() {
  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-blue-600/5 to-purple-600/5">
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" /> Language & Region
        </CardTitle>
        <CardDescription>
          Manage your language and display settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Language</Label>
          <Select defaultValue="en">
            <SelectTrigger>
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English (US)</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Timezone</Label>
          <div className="p-2 border rounded bg-muted/50 text-sm text-muted-foreground">
            Central Time (US & Canada)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CommunicationPreferencesCard() {
  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-blue-600/5 to-purple-600/5">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> Communication Preferences
        </CardTitle>
        <CardDescription>
          Select the type of content you want to receive.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox id="comm-news" defaultChecked />
          <Label htmlFor="comm-news">Community News & Announcements</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="comm-reports" defaultChecked />
          <Label htmlFor="comm-reports">Board Meeting Reports & Minutes</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="comm-events" defaultChecked />
          <Label htmlFor="comm-events">Social Events & Gatherings</Label>
        </div>
      </CardContent>
    </Card>
  );
}

function PrivacySettingsCard() {
  const { data: session }: any = useSession();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<any>("/auth/me"),
    enabled: !!session,
  });

  const updatePrivacy = useMutation({
    mutationFn: (data: any) => apiPutJson(`/users/${session?.user?.id}`, data),
    onSuccess: () => {
      toast({ title: "Privacy settings updated" });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading)
    return (
      <Card>
        <CardContent className="p-6">Loading privacy settings...</CardContent>
      </Card>
    );

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-blue-600/5 to-purple-600/5">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <span>Privacy Options</span>
        </CardTitle>
        <CardDescription>
          Control who can see your contact information in the community
          directory.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid gap-3">
          <Label className="text-base font-semibold">
            Directory Visibility
          </Label>
          <p className="text-sm text-muted-foreground">
            Choose who can see your profile in the community directory.
          </p>
          <Select
            value={me?.directory_visibility || "RESIDENTS"}
            onValueChange={(val) =>
              updatePrivacy.mutate({ directory_visibility: val })
            }
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RESIDENTS">Residents Only</SelectItem>
              <SelectItem value="BOARD">Board Members Only</SelectItem>
              <SelectItem value="HIDDEN">Hidden from Directory</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 border-t pt-6">
          <Label className="text-base font-semibold">
            Granular Visibility Toggles
          </Label>
          <p className="text-sm text-muted-foreground mb-4">
            Select which specific fields are visible when your profile is
            viewed.
          </p>

          <div className="grid gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Show Full Name</Label>
                <p className="text-xs text-muted-foreground">
                  If disabled, you will appear as &quot;Resident&quot;.
                </p>
              </div>
              <Switch
                checked={me?.privacy_show_name ?? true}
                onCheckedChange={(checked) =>
                  updatePrivacy.mutate({ privacy_show_name: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  Show Email Address
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show your primary email in the directory.
                </p>
              </div>
              <Switch
                checked={me?.privacy_show_email ?? false}
                onCheckedChange={(checked) =>
                  updatePrivacy.mutate({ privacy_show_email: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Show Phone Number</Label>
                <p className="text-xs text-muted-foreground">
                  Allow others to see your contact phone.
                </p>
              </div>
              <Switch
                checked={me?.privacy_show_phone ?? false}
                onCheckedChange={(checked) =>
                  updatePrivacy.mutate({ privacy_show_phone: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  Show Address / Unit
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show your specific unit address in your profile.
                </p>
              </div>
              <Switch
                checked={me?.privacy_show_address ?? false}
                onCheckedChange={(checked) =>
                  updatePrivacy.mutate({ privacy_show_address: checked })
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AutopaySettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" /> Autopay Preferences
        </CardTitle>
        <CardDescription>
          Manage your automatic payment settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>
              Autopay is currently <strong>disabled</strong>.
            </span>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/set-up-autopay">Manage Autopay</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await apiPutJson("/users/me/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast({ title: "Success", description: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </CardTitle>
        <CardDescription>Update your login credentials.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Confirm Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end border-t pt-4">
        <Button onClick={handleChangePassword} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Update Password
        </Button>
      </CardFooter>
    </Card>
  );
}
