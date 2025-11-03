"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "./utils";

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    className={cn("w-full", className)}
    {...props}
  />
));
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Container styling with perfect alignment
      "inline-flex h-11 w-full items-center justify-center",
      // Background and border
      "rounded-lg bg-muted/20 p-1",
      // Ensure no flex wrapping
      "flex-nowrap overflow-hidden",
      // Consistent spacing
      "gap-0 border border-border/50",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Perfect flexbox centering
      "inline-flex items-center justify-center whitespace-nowrap",
      // Exact sizing for consistency
      "h-9 flex-1 px-3 py-0",
      // Typography and text alignment
      "text-sm font-medium text-center leading-none",
      // Border radius
      "rounded-md",
      // Transitions for smooth interactions
      "transition-all duration-200 ease-in-out",
      // Focus states
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      // Disabled state
      "disabled:pointer-events-none disabled:opacity-50",
      // Default inactive state
      "text-muted-foreground bg-transparent",
      // Hover state
      "hover:bg-muted/50 hover:text-foreground",
      // Active state with explicit styling
      "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:font-medium data-[state=active]:shadow-sm",
      // Prevent text overflow
      "overflow-hidden text-ellipsis",
      // Box model consistency
      "box-border min-w-0",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };