/*
 * wbig.gs — content lives here.
 * Add a repo to a category and it shows up on the page. Any public, non-fork
 * repo under github.com/wesbiggs that isn't listed here will also appear
 * automatically in "Fresh from the lab" (fetched live from the GitHub API).
 */
window.SITE = {
  github: "wesbiggs",

  categories: [
    {
      id: "ai",
      portal: "Machines that talk back",
      title: "AI, local & otherwise",
      blurb:
        "Mostly on Apple Silicon, mostly without vendor lock-in. I like models I can run on my own desk and tools that let me swap brains freely.",
      repos: [
        {
          name: "skinnyai", image: "assets/og/skinnyai.jpg",
          lang: "JavaScript",
          desc: "Use and share AI without vendor lock-in. One small client for cloud and local models over Ollama, OpenAI or Anthropic APIs.",
        },
        {
          name: "mfluxible", image: "assets/og/mfluxible.jpg",
          lang: "Python",
          stars: 3,
          desc: "A streaming HTTP API for MLX image generation models on Apple Silicon, built on mflux. OpenAI-compatible, so your existing tools just work.",
          tags: ["mlx", "flux", "qwen-image"],
        },
        {
          name: "claude-magic-link-watcher", image: "assets/og/claude-magic-link-watcher.jpg",
          lang: "TypeScript",
          desc: "Watches an IMAP mailbox for Claude.ai magic sign-in links and opens them for you. A tiny bit of automation that saves a lot of tab-juggling.",
          tags: ["imap", "macos"],
        },
      ],
    },
    {
      id: "dweb",
      portal: "The open social web",
      title: "Decentralized everything",
      blurb:
        "Your social graph should belong to you. Content should be addressable by what it is, not where it lives. These are the small tools I build around those ideas.",
      repos: [
        {
          name: "rasler", image: "assets/og/rasler.jpg",
          lang: "JavaScript",
          stars: 1,
          desc: "A RASL web server with MASL metadata support and flexible configuration. Content-addressable storage over plain old HTTP.",
          tags: ["rasl", "cid"],
        },
        {
          name: "rasl-browser-ext", image: "assets/og/rasl-browser-ext.jpg",
          lang: "JavaScript",
          desc: "A Firefox extension that checks RASL content integrity using CID hashes, Unencoded-Digest headers and MASL documents.",
        },
        {
          name: "did-web-vc-demo", image: "assets/og/did-web-vc-demo.jpg",
          lang: "JavaScript",
          desc: "A worked example of publishing a did:web identity and using it with W3C Verifiable Credentials.",
          tags: ["did", "vc"],
        },
        {
          name: "gateway-user-maker", image: "assets/og/gateway-user-maker.jpg",
          lang: "TypeScript",
          desc: "Utility code for creating new users programmatically through the Frequency Developer Gateway's account service.",
        },
        {
          name: "ideas", image: "assets/og/ideas.jpg",
          lang: "",
          stars: 2,
          desc: "Technical proposals and other half-baked things. The notebook I leave lying around in public.",
        },
      ],
    },
    {
      id: "c64",
      portal: "8-bit & beyond",
      title: "Commodore 64",
      blurb:
        "The C64 is where it started for me, and in 2026 it's back on the desk. These days it's wired to a TeensyROM, talks TCP, and chats with LLMs.",
      repos: [
        {
          name: "petty", image: "assets/og/petty.png",
          lang: "JavaScript",
          stars: 1,
          crossover: "AI",
          desc: "A Commodore 64 terminal for Claude Code (or anything else). A headless xterm on the Mac sends screen-code diffs to a 1.2 KB 6502 client.",
          tags: ["6502", "petscii", "cc65"],
        },
        {
          name: "skinnyai-c64", image: "assets/og/skinnyai-c64.jpg",
          lang: "C",
          crossover: "AI",
          desc: "SkinnyAI 64: a chat client for Ollama and OpenAI-compatible servers, running on a real C64 over a SwiftLink network modem.",
        },
        {
          name: "teensyrom-vdrive", image: "assets/og/teensyrom-vdrive.jpg",
          lang: "Python",
          desc: "Turns a TeensyROM+'s SD card and USB stick into virtual IEC disk drives (.d64 / .d71 / .d81) with a patched KERNAL. No extra cable needed.",
          tags: ["kernal", "iec", "1541"],
        },
        {
          name: "vic2orious", image: "assets/og/vic2orious.png",
          lang: "Python",
          desc: "Formats, tools and libraries for getting the most out of the C64's VIC-II chip.",
          tags: ["vic-ii", "graphics"],
        },
        {
          name: "teensyrom-snoop", image: "assets/og/teensyrom-snoop.png",
          lang: "Python",
          desc: "A TeensyROM firmware patch that captures SID register writes and streams them over TCP, so a remote listener can rebuild the sound.",
          tags: ["sid", "audio"],
        },
        {
          name: "teensyrom-rcp", image: "assets/og/teensyrom-rcp.jpg",
          lang: "Python",
          desc: "Command-line tools for reading and writing a TeensyROM+'s SD card and USB drive and controlling the C64 over TCP.",
        },
        {
          name: "petskey-remote", image: "assets/og/petskey-remote.png",
          lang: "Python",
          desc: "Ever wanted to use your Commodore 64 or 128 as a keyboard for a Raspberry Pi? No? Well, indulge me anyway.",
        },
        {
          name: "petty-d418", image: "assets/og/petty-d418.jpg",
          lang: "JavaScript",
          frozen: true,
          desc: "A frozen research prototype: speech and music squeezed out of the SID's volume register ($D418). Superseded by PETTY's sound.",
        },
      ],
    },
  ],

  // Projects I've contributed to (public PRs, issues, specs, docs)
  contributions: [
    {
      group: "Decentralized social & identity",
      color: "teal",
      items: [
        { repo: "LibertyDSNP/spec", role: "maintainer", note: "The DSNP spec & white paper" },
        { repo: "LibertyDSNP/dsnp-verifiable-credentials", role: "maintainer", note: "VCs, the DSNP way" },
        { repo: "LibertyDSNP/dsnp-schemas" },
        { repo: "LibertyDSNP/frequency-schemas" },
        { repo: "LibertyDSNP/dsnp-did-resolver" },
        { repo: "LibertyDSNP/dsnp-hash-util" },
        { repo: "LibertyDSNP/multiformat-inspector" },
        { repo: "LibertyDSNP/papers" },
        { repo: "DSNP-org/dsnp-web" },
        { repo: "frequency-chain/frequency", note: "A Polkadot parachain (Rust)" },
        { repo: "frequency-chain/gateway", note: "Frequency Developer Gateway" },
        { repo: "frequency-chain/docs" },
        { repo: "frequency-chain/testnet-faucet" },
        { repo: "ProjectLibertyLabs/siwf", note: "Sign In With Frequency" },
        { repo: "ProjectLibertyLabs/dsnp-did-resolver-frequency" },
        { repo: "ProjectLibertyLabs/vc-schema" },
        { repo: "ProjectLibertyLabs/wallet-proxy" },
        { repo: "ProjectLibertyLabs/dsnp-gateway-prototype" },
        { repo: "darobin/rasl", note: "RASL for Express" },
        { repo: "ipfs/helia", note: "IPFS in TypeScript" },
        { repo: "savely-krasovsky/bsky-did-web", note: "Bluesky accounts on did:web" },
      ],
    },
    {
      group: "AI & machine learning",
      color: "violet",
      items: [
        { repo: "SillyTavern/SillyTavern", note: "LLM front end for power users" },
        { repo: "jundot/omlx", note: "LLM serving on Apple Silicon" },
        { repo: "mflux-community/mflux", note: "MLX image & video models" },
        { repo: "jonigl/mcp-client-for-ollama", note: "ollmcp: an MCP client TUI" },
      ],
    },
    {
      group: "Retro & terminals",
      color: "blue",
      items: [
        { repo: "SensoriumEmbedded/TeensyROM", note: "The C64 cartridge that does everything" },
        { repo: "migueldeicaza/SwiftTerm", note: "xterm in Swift" },
      ],
    },
    {
      group: "Tools & infrastructure",
      color: "orange",
      items: [
        { repo: "liquibase/liquibase", note: "Database schema evolution" },
        { repo: "BookStackApp/BookStack", note: "A self-hosted wiki" },
      ],
    },
  ],

  // Before GitHub existed (or before I used it)
  vintage: [
    { name: "gnu.regexp", role: "maintainer", note: "Regular expressions for Java, back before java.util.regex existed" },
    { name: "XORM", role: "maintainer", note: "An extensible object-relational mapping layer" },
    { name: "Synclast UI", role: "co-maintainer", note: "A J2ME user interface platform for flip-phone-era Java" },
    { name: "JDOM", role: "contributor", note: "XML for Java, done the friendly way" },
    { name: "CGLIB", role: "contributor", note: "Bytecode generation" },
  ],

  // Personal CHANGELOG: storage media evolve as the years go by.
  // media: floppy525 | floppy35 | hdd | cloud | chain | neural
  changelog: [
    { year: "1985", media: "floppy525", label: "FIRST BUILD", text: "Started breaking builds. Haven't stopped since.", color: "#f4efe0" },
    { year: "1992", media: "floppy525", label: "USC", text: "B.S. in Computer Science: learned the rules properly so I could break them on purpose.", color: "#ffe066" },
    { year: "1996", media: "floppy35", label: "THE EARLY WEB", text: "The LA Times, Lot 11 Studios, DreamMedia/USWeb. We used blink tags, and we weren't sorry.", color: "#9ae29b" },
    { year: "2001", media: "floppy35", label: "PROFESSOR-ISH", text: "Taught Intro to Online Publishing at USC Annenberg, back when \"online\" still needed explaining.", color: "#d4b8ff" },
    { year: "2002", media: "hdd", label: "MOBILE MEDIA", text: "Moviso: storefronts for mobile operators before \"app store\" was a phrase. Came away with a patent.", color: "#ffb38a" },
    { year: "2008", media: "hdd", label: "ADFONIC", text: "Co-founded one of the first mobile programmatic ad platforms. Lots of bids, lots of milliseconds.", color: "#ff8a9a" },
    { year: "2015", media: "cloud", label: "POPWALLET", text: "Founded it: coupons, loyalty cards and tickets in Apple Wallet & Google Pay. Acquired by Snap in 2021.", color: "#ffe066" },
    { year: "2022", media: "chain", label: "PROJECT LIBERTY", text: "Chief Architect on DSNP and the Frequency blockchain. Your social graph should be yours.", color: "#6ee7d8" },
    { year: "2026", media: "neural", label: "NOW", text: "CTO at Zenivize, linking wallet promotions to loyalty programs. Off the clock: LLMs on my desk, and a 1982 computer that chats with them.", color: "#a0f0ff", link: "https://zenivize.com" },
  ],
};

// Star counts snapshot (Nov 2026), so contribution stickers can be sized by gravity.
window.SITE.stars = {
  "LibertyDSNP/spec": 45, "LibertyDSNP/dsnp-verifiable-credentials": 1, "LibertyDSNP/dsnp-schemas": 1,
  "LibertyDSNP/frequency-schemas": 6, "LibertyDSNP/dsnp-did-resolver": 0, "LibertyDSNP/dsnp-hash-util": 0,
  "LibertyDSNP/multiformat-inspector": 1, "LibertyDSNP/papers": 57, "DSNP-org/dsnp-web": 0,
  "frequency-chain/frequency": 57, "frequency-chain/gateway": 7, "frequency-chain/docs": 7,
  "frequency-chain/testnet-faucet": 0, "ProjectLibertyLabs/siwf": 3,
  "ProjectLibertyLabs/dsnp-did-resolver-frequency": 0, "ProjectLibertyLabs/vc-schema": 0,
  "ProjectLibertyLabs/wallet-proxy": 0, "ProjectLibertyLabs/dsnp-gateway-prototype": 2,
  "darobin/rasl": 4, "ipfs/helia": 1358, "savely-krasovsky/bsky-did-web": 13,
  "SillyTavern/SillyTavern": 35532, "jundot/omlx": 23536, "mflux-community/mflux": 2597,
  "jonigl/mcp-client-for-ollama": 836, "SensoriumEmbedded/TeensyROM": 232,
  "migueldeicaza/SwiftTerm": 1762, "liquibase/liquibase": 5642, "BookStackApp/BookStack": 19139,
};
