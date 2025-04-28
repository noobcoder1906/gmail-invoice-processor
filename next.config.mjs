let userConfig = undefined;
try {
  userConfig = await import('./v0-user-next.config.mjs');
} catch (e) {
  try {
    userConfig = await import("./v0-user-next.config");
  } catch (innerError) {
    // ignore error
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },

  webpack(config) {
    config.module.rules.push({
      test: /node_modules[\\/]pdf-parse[\\/]index\.js$/,
      loader: "string-replace-loader",
      options: {
        search: /let isDebugMode = !module\.parent;[\s\S]*?if \(isDebugMode\) \{[\s\S]*?\}/,
        replace: `let isDebugMode = false; // debug block removed`,
      },
    });

    // ✅ Step 2: Remove the debug block cleanly
    config.module.rules.push({
      test: /pdf-parse[\\\/]index\.js$/,
      loader: "string-replace-loader",
      options: {
        search: `if (isDebugMode) {`,
        replace: `// stripped debug logic`,
      },
    });

    if (typeof userConfig?.default?.webpack === 'function') {
      return userConfig.default.webpack(config);
    }

    return config;
  },
};

// ✅ Merge external config (except webpack which we override manually)
if (userConfig) {
  const config = userConfig.default || userConfig;
  for (const key in config) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...config[key],
      };
    } else if (key !== 'webpack') {
      nextConfig[key] = config[key];
    }
  }
}

export default nextConfig;
