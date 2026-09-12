"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                            Lightweight Tabs (a11y)                         */
/*  API-nya disamakan dengan shadcn/ui <Tabs> agar mudah diganti Radix nanti.  */
/* -------------------------------------------------------------------------- */

type TabsContextValue = {
  value: string
  setValue: (value: string) => void
  ids: (value: string) => { trigger: string; content: string }
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabs(caller: string) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error(`<${caller}> must be rendered inside <Tabs>`)
  return ctx
}

type TabsProps = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

export function Tabs({
  value: controlled,
  defaultValue,
  onValueChange,
  className,
  children,
}: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? "")
  const value = controlled ?? internal

  const setValue = React.useCallback(
    (next: string) => {
      if (controlled === undefined) setInternal(next)
      onValueChange?.(next)
    },
    [controlled, onValueChange]
  )

  const ids = React.useCallback(
    (v: string) => ({
      trigger: `tab-${v}`,
      content: `tabpanel-${v}`,
    }),
    []
  )

  return (
    <TabsContext.Provider value={{ value, setValue, ids }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex w-full items-center justify-start gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1 dark:bg-neutral-900",
        className
      )}
      {...props}
    />
  )
}

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: TabsTriggerProps) {
  const ctx = useTabs("TabsTrigger")
  const { trigger, content } = ctx.ids(value)
  const active = ctx.value === value

  return (
    <button
      id={trigger}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={content}
      tabIndex={active ? 0 : -1}
      onClick={() => ctx.setValue(value)}
      className={cn(
        "inline-flex min-w-fit flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 sm:px-4",
        active
          ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-neutral-50"
          : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: TabsContentProps) {
  const ctx = useTabs("TabsContent")
  const { trigger, content } = ctx.ids(value)
  if (ctx.value !== value) return null

  return (
    <div
      id={content}
      role="tabpanel"
      aria-labelledby={trigger}
      tabIndex={0}
      className={cn(
        "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/** Keyboard navigation panah kiri/kanan untuk TabsList (WAI-ARIA). */
export function useTabKeyboardNav(ref: React.RefObject<HTMLDivElement | null>) {
  const ctx = useTabs("useTabKeyboardNav")

  return React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return
      const root = ref.current
      if (!root) return
      const triggers = Array.from(
        root.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      ).filter((el) => !el.disabled)
      if (triggers.length === 0) return

      event.preventDefault()
      const current = triggers.findIndex((el) => el.getAttribute("aria-selected") === "true")
      const delta = event.key === "ArrowRight" ? 1 : -1
      const next = (current + delta + triggers.length) % triggers.length
      const target = triggers[next]
      ctx.setValue(target.value)
      target.focus()
    },
    [ctx, ref]
  )
}
