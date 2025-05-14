// client/react.test.js
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Banner from "./src/components/Banner";

describe("Create Post button in <Banner />", () => {
  const baseProps = {
    onTitleClick: () => {},
    onSearch: () => {},
    onCreatePost: () => {},
    onLogout: () => {},
    onError: () => {},
    onProfileClick: () => {},
    isCreatePostActive: false,
    isProfileActive: false,
  };

  test("is disabled when viewing as guest", () => {
    render(
      <Banner
        {...baseProps}
        isLoggedIn={false}
        currentUser={{ guest: true, displayName: "Guest" }}
      />
    );
    const createBtn = screen.getByRole("button", { name: /create post/i });
    expect(createBtn).toBeDisabled();
  });

  test("is enabled when viewing as a registered user", () => {
    render(
      <Banner
        {...baseProps}
        isLoggedIn={true}
        currentUser={{ guest: false, displayName: "Alice" }}
      />
    );
    const createBtn = screen.getByRole("button", { name: /create post/i });
    expect(createBtn).toBeEnabled();
  });
});
