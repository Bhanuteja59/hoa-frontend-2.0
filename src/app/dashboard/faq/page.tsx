"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Search, HelpCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const faqData = [
    {
        category: "General",
        questions: [
            { q: "How do I update my contact information?", a: "You can update your contact information by going to your Profile page (accessible from the top right avatar). Navigate to the 'Contact Info' tab and click the edit icon." },
            { q: "Where can I find HOA documents?", a: "Important documents, bylaws, and forms are located in the 'Documents' section of the dashboard." },
            { q: "How do I contact the board?", a: "You can submit a general inquiry through the 'Requests' page or check the 'Community Directory' for board member contact details if they are public." }
        ]
    },
    {
        category: "Payments & Dues",
        questions: [
            { q: "When are HOA dues due?", a: "HOA dues are typically due on the 1st of each month. Late fees may apply after the 15th." },
            { q: "How do I set up autopay?", a: "Go to 'Set Up Autopay' in the sidebar. You can link your bank account or credit card for recurring payments." },
            { q: "Can I view my payment history?", a: "Yes, the 'Set Up Autopay' section includes a ledger of your past payments and current irregularities." }
        ]
    },
    {
        category: "Architectural Requests (ARC)",
        questions: [
            { q: "Do I need approval to paint my house?", a: "Yes, exterior painting requires ARC approval. Please submit an ARC Request via the 'Requests' page." },
            { q: "How long does the approval process take?", a: "The ARC committee typically reviews requests within 30 days of submission." }
        ]
    },
    {
        category: "Amenities",
        questions: [
            { q: "What are the pool hours?", a: "The community pool is open from 6:00 AM to 10:00 PM daily." },
            { q: "How do I reserve the clubhouse?", a: "Clubhouse reservations can be made through the 'Calendar & Events' page. Check for availability and look for the 'Reserve' button (if enabled) or contact the property manager." }
        ]
    }
];

export default function FAQPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredFAQs = faqData.map(cat => ({
        ...cat,
        questions: cat.questions.filter(q =>
            q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.questions.length > 0);

    return (
        <div className="flex-1 space-y-4 p-4 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
            </div>

            <Card className="bg-muted/50 border-none shadow-none mb-8">
                <CardContent className="pt-6">
                    <div className="flex items-center space-x-2 max-w-xl mx-auto">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search for help..."
                                className="pl-9 bg-background h-12 text-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button size="lg">Search</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-1 max-w-4xl mx-auto">
                {filteredFAQs.length === 0 ? (
                    <div className="text-center py-12">
                        <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground">No results found</h3>
                        <p className="text-sm text-muted-foreground">Try adjusting your search terms.</p>
                    </div>
                ) : (
                    filteredFAQs.map((cat, idx) => (
                        <Card key={idx}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    {cat.category}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {cat.questions.map((faq, qIdx) => (
                                        <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                                            <AccordionTrigger className="text-left font-medium text-base">
                                                {faq.q}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                                {faq.a}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
