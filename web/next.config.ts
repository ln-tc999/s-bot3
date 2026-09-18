import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  /**
   * `next dev` writes AGENTS.md and CLAUDE.md into this folder on every run and
   * recreates them if deleted. Nothing here needs them, and an unexplained pair
   * of agent files is noise in a repo someone else is about to read.
   */
  agentRules: false,
};

export default nextConfig;
