import "@/tests/helpers/nextIntlServerEnMock";
import { describe, it, expect, vi } from "vitest";
import ClientsPage, { generateMetadata } from "@/app/(site)/clients/page";
import { CLIENT_DIRECTORY_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { getPublishedRecords } from "@/lib/clients/clientRegistry";

vi.mock("@/features/site/clients/ClientsPageView", () => ({
  ClientsPageView: vi.fn(async () => <div data-testid="clients-page-view">Clients Page Content</div>),
}));

describe("app/(site)/clients/page.tsx", () => {
  it("generateMetadata returns CLIENT_DIRECTORY_PAGE_METADATA", async () => {
    const meta = await generateMetadata();
    expect(meta).toEqual(CLIENT_DIRECTORY_PAGE_METADATA);
  });

  it("ClientsPage renders Schema.org ItemList JSON-LD with all 116 canonical published client organisations", async () => {
    const publishedClients = getPublishedRecords();
    expect(publishedClients).toHaveLength(116);

    const jsx = await ClientsPage();
    expect(jsx).toBeDefined();

    // Check fragment children for the JSON-LD script
    const children = Array.isArray(jsx.props.children) ? jsx.props.children : [jsx.props.children];
    const scriptElement = children.find(
      (child: { type?: string; props?: { type?: string } }) =>
        child?.type === "script" && child?.props?.type === "application/ld+json",
    );

    expect(scriptElement).toBeDefined();
    const rawJson = scriptElement.props.dangerouslySetInnerHTML.__html;
    expect(typeof rawJson).toBe("string");

    const parsed = JSON.parse(rawJson);
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@type"]).toBe("ItemList");
    expect(parsed["@id"]).toContain("/clients/#clients-directory");
    expect(parsed.name).toBe("One and Only Enterprise & Institutional Client Directory");
    expect(parsed.description).toContain("Verified workplace installations");
    expect(parsed.numberOfItems).toBe(116);
    expect(parsed.itemListElement).toHaveLength(116);

    for (let i = 0; i < parsed.itemListElement.length; i++) {
      const el = parsed.itemListElement[i];
      const client = publishedClients[i];

      expect(el["@type"]).toBe("ListItem");
      expect(el.position).toBe(i + 1);

      const org = el.item;
      expect(org["@type"]).toBe("Organization");
      expect(org["@id"]).toContain(`/clients/#${client.canonicalId}-org`);
      expect(org.url).toContain(`/clients/#${client.canonicalId}`);
      expect(org.name).toBe(client.displayName);
      expect(org.logo).toBeDefined();
      expect(org.logo).toMatch(/^https?:\/\/.+\/assets\/marketing\/client-logos\/.+/);
      expect(org.image).toBe(org.logo);
    }
  });
});

