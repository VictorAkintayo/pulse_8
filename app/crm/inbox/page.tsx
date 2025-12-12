"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";

interface Message {
  id: string;
  metadata: {
    from: string;
    to: string;
    subject: string;
    body?: string;
    channel?: string;
    customerId?: string;
  };
  createdAt: string;
}

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Not authenticated");
        return;
      }

      const response = await fetch("/api/crm/inbox/messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load messages");
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
      alert("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Inbox</h1>
        <p className="text-muted-foreground">
          Manage customer messages and communications
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Message List */}
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {messages.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No messages
                </div>
              ) : (
                <div className="divide-y">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                        selectedMessage?.id === message.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm truncate">
                          {message.metadata.from}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {message.metadata.subject}
                      </p>
                      {message.metadata.channel && (
                        <span className="inline-block mt-2 text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                          {message.metadata.channel}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Detail */}
        <div className="col-span-2">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedMessage.metadata.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      From: {selectedMessage.metadata.from}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      To: {selectedMessage.metadata.to}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </p>
                    {selectedMessage.metadata.channel && (
                      <span className="inline-block mt-2 text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        {selectedMessage.metadata.channel}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">
                    {selectedMessage.metadata.body || "No body content"}
                  </p>
                </div>
                {selectedMessage.metadata.customerId && (
                  <div className="mt-6 pt-6 border-t">
                    <Button
                      onClick={() => {
                        // Navigate to customer detail
                        window.location.href = `/crm/customers/${selectedMessage.metadata.customerId}`;
                      }}
                    >
                      View Customer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Select a message to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

