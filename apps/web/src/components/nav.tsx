import {
  ChevronRight, type LucideIcon
} from "lucide-react"
import {
  SidebarMenuButton, SidebarMenuItem, SidebarMenuLink, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem
} from "./ui/sidebar"
import { Link } from "@tanstack/react-router"
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from "./ui/collapsible"
import { Button } from "./ui/button"

export interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

export function NavItem({ item }: { item: NavItem }) {
  return (item.items == null || !item.items.length) ? (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.title}
        render={() => {
          return (
            <Link to={item.url}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </Link>
          )
        }}
      />
    </SidebarMenuItem>
  ) : (
    <SidebarMenuItem className="group/collapsible">
      <Collapsible defaultOpen={item.isActive}>
        <CollapsibleTrigger
          render={
            <SidebarMenuButton tooltip={item.title}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[panel-open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          }
        />
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  render={
                    <Link to={subItem.url}>
                      <span>{subItem.title}</span>
                    </Link>
                  }
                />
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}
