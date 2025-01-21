import React from 'react';
import { Chat } from '../src/components/Chat';
import { ComingSoon } from '../components/ComingSoon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../src/components/ui/tabs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <Tabs defaultValue="olivia" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="olivia">Olivia</TabsTrigger>
            <TabsTrigger value="riley">Riley</TabsTrigger>
            <TabsTrigger value="avery">Avery</TabsTrigger>
          </TabsList>
          <TabsContent value="olivia">
            <Chat />
          </TabsContent>
          <TabsContent value="riley">
            <ComingSoon />
          </TabsContent>
          <TabsContent value="avery">
            <ComingSoon />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
} 