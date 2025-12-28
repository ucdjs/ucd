import type { Icon } from "@phosphor-icons/react";
import { CaretRightIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { buttonVariants } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./ui/sidebar";

export interface NavItemProps {
  title: string;
  url: string;
  icon?: Icon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
}

export function NavItem({ item }: { item: NavItemProps }) {
  return (item.items == null || !item.items.length)
    ? (
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={item.title}
            render={() => {
              return (
                <Link to={item.url} className={clsx(buttonVariants({ variant: "ghost" }), "inline-block")}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              );
            }}
          />
        </SidebarMenuItem>
      )
    : (
        <SidebarMenuItem className="group/collapsible">
          <Collapsible defaultOpen={item.isActive}>
            <CollapsibleTrigger
              render={(
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <CaretRightIcon className="ml-auto transition-transform duration-200 group-data-panel-open/collapsible:rotate-90" />
                </SidebarMenuButton>
              )}
            />
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      render={(
                        <Link to={subItem.url}>
                          <span>{subItem.title}</span>
                        </Link>
                      )}
                    />
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenuItem>
      );
}
