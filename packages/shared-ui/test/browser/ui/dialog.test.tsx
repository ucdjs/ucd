import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#ui/dialog";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

describe("Dialog", () => {
  it("does not render dialog content when closed", () => {
    render(
      <Dialog>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open dialog" })).toBeInTheDocument();
  });

  it("opens the dialog when the trigger is clicked", async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>My dialog</DialogTitle>
            <DialogDescription>Dialog content here</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    expect(screen.getByText("My dialog")).toBeInTheDocument();
    expect(screen.getByText("Dialog content here")).toBeInTheDocument();
  });

  it("closes the dialog when the built-in close button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Close me</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("renders DialogFooter children", async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Footer test</DialogTitle>
          <DialogFooter>
            <button type="button">Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    });
  });

  it("renders without close button when showCloseButton is false", async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogTitle>No close button</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });
});
