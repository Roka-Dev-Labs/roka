/**
 * LogHub 2k rerun — 10 Nov 2026.
 * Engine: roka-mcp/lib/prune.js pruneText (same path MCP prune_file uses).
 * Command equivalent: prune_file(path, budget=4000) with no query.
 * Corpus: github.com/logpai/loghub *_2k.log, 15 sources. Zookeeper excluded.
 * Crash line = CRASH_PATTERN /\b(ERROR|FATAL|CRITICAL|Exception|Traceback|panic)\b/i
 */
window.ROKA_LOGHUB_RUN = {
  date: "2026-11-10",
  tool: "prune_file",
  budget: 4000,
  query: "",
  crashPattern: String.raw`\b(ERROR|FATAL|CRITICAL|Exception|Traceback|panic)\b`,
  totals: {
    files: 15,
    originalLines: 30003,
    originalChars: 4178984,
    prunedChars: 59690,
    prunedLines: 501,
    meanLinesRemoved: 98.3,
    meanCompression: 70,
    crashFiles: 11,
    crashFilesKept: 11,
  },
  thunderbird: {
    file: "Thunderbird_2k.log",
    originalLines: 2000,
    originalChars: 325192,
    prunedLines: 29,
    prunedChars: 3965,
    bindIndex0: 1465,
    bindPercent: 73.3,
    tailLines: 28,
    tailChars: 4000,
    tailHasBind: false,
    pruneHasBind: true,
  },
  /* Sorted by lines-removed, lowest first. Lower is not worse. */
  datasets: [
    { id: "hpc", name: "HPC", file: "HPC_2k.log", system: "HPC cluster", about: "HPC cluster logs with interconnect, RAS, and job-scheduler telemetry.", linesIn: 2001, linesOut: 58, linesRemoved: 97.1, charsIn: 151178, charsOut: 3980, crashIn: 513, crashOut: 57, omittedProtected: 542, crashKept: "yes" },
    { id: "linux", name: "Linux", file: "Linux_2k.log", system: "Linux syslog", about: "Linux syslog-style system logs — kernel, cron, authentication, and daemon messages.", linesIn: 2000, linesOut: 56, linesRemoved: 97.2, charsIn: 216485, charsOut: 3996, crashIn: 1, crashOut: 1, omittedProtected: 0, crashKept: "yes", crashNote: "The only regex hit is “Enabling unmasked SIMD FPU exception support” — the word exception, not a kernel panic." },
    { id: "apache", name: "Apache", file: "Apache_2k.log", system: "Apache HTTP Server", about: "Apache HTTP Server error log. [error] matches the crash regex as the whole word error.", linesIn: 2000, linesOut: 50, linesRemoved: 97.5, charsIn: 171239, charsOut: 3969, crashIn: 595, crashOut: 50, omittedProtected: 1393, crashKept: "yes" },
    { id: "spark", name: "Spark", file: "Spark_2k.log", system: "Apache Spark", about: "Spark driver/executor logs. This 2k sample has no line matching the crash regex, so the pack is recency only.", linesIn: 2001, linesOut: 44, linesRemoved: 97.8, charsIn: 196268, charsOut: 3999, crashIn: 0, crashOut: 0, omittedProtected: 0, crashKept: "n/a" },
    { id: "healthapp", name: "HealthApp", file: "HealthApp_2k.log", system: "Mobile health app", about: "Health-app component logs. No crash-regex line in this sample.", linesIn: 2000, linesOut: 39, linesRemoved: 98.0, charsIn: 187456, charsOut: 3994, crashIn: 0, crashOut: 0, omittedProtected: 0, crashKept: "n/a" },
    { id: "android", name: "Android", file: "Android_2k.log", system: "Android", about: "Android system and application logs. No crash-regex line in this sample; the pack is recency.", linesIn: 2000, linesOut: 33, linesRemoved: 98.4, charsIn: 279076, charsOut: 3984, crashIn: 0, crashOut: 0, omittedProtected: 0, crashKept: "n/a" },
    { id: "hdfs", name: "HDFS", file: "HDFS_2k.log", system: "Hadoop HDFS", about: "HDFS namenode/datanode logs. “Got exception while serving” matches Exception.", linesIn: 2001, linesOut: 29, linesRemoved: 98.6, charsIn: 287848, charsOut: 3982, crashIn: 80, crashOut: 28, omittedProtected: 132, crashKept: "yes" },
    { id: "openssh", name: "OpenSSH", file: "OpenSSH_2k.log", system: "sshd auth", about: "OpenSSH auth log. error: Received disconnect / JSchException match the crash regex.", linesIn: 2000, linesOut: 28, linesRemoved: 98.6, charsIn: 225216, charsOut: 3993, crashIn: 48, crashOut: 28, omittedProtected: 197, crashKept: "yes" },
    { id: "proxifier", name: "Proxifier", file: "Proxifier_2k.log", system: "Windows proxy client", about: "Proxifier connection log. Lines with “error :” match the crash regex.", linesIn: 2000, linesOut: 29, linesRemoved: 98.6, charsIn: 236962, charsOut: 3914, crashIn: 97, crashOut: 29, omittedProtected: 191, crashKept: "yes" },
    { id: "thunderbird", name: "Thunderbird", file: "Thunderbird_2k.log", system: "Thunderbird supercomputer", about: "Sandia Thunderbird syslog. Two crash-regex lines: vesafb error -6, and sshd Bind to port 22. Both kept, with ±2 neighbors.", linesIn: 2000, linesOut: 29, linesRemoved: 98.6, charsIn: 325192, charsOut: 3965, crashIn: 2, crashOut: 2, omittedProtected: 0, crashKept: "yes" },
    { id: "bgl", name: "BGL", file: "BGL_2k.log", system: "Blue Gene/L", about: "IBM Blue Gene/L RAS logs. Many INFO lines contain the word error (e.g. “parity error corrected”). 547 regex hits, 26 fit the budget, 821 protected lines omitted.", linesIn: 2000, linesOut: 26, linesRemoved: 98.7, charsIn: 317150, charsOut: 3950, crashIn: 547, crashOut: 26, omittedProtected: 821, crashKept: "yes" },
    { id: "windows", name: "Windows", file: "Windows_2k.log", system: "Windows CBS", about: "Windows Component-Based Servicing. Hundreds of “Failed” CBS lines — Failed is not in the crash regex, so this file is recency-only.", linesIn: 2000, linesOut: 26, linesRemoved: 98.7, charsIn: 285433, charsOut: 3998, crashIn: 0, crashOut: 0, omittedProtected: 0, crashKept: "n/a" },
    { id: "hadoop", name: "Hadoop", file: "Hadoop_2k.log", system: "Hadoop MapReduce", about: "Hadoop MapReduce logs with ERROR-level lines. 160 crash-regex hits, 20 fit.", linesIn: 2000, linesOut: 20, linesRemoved: 99.0, charsIn: 384948, charsOut: 3981, crashIn: 160, crashOut: 20, omittedProtected: 746, crashKept: "yes" },
    { id: "mac", name: "Mac", file: "Mac_2k.log", system: "macOS", about: "macOS system log. “Error Domain=” matches the crash regex. 154 hits, 18 fit.", linesIn: 2000, linesOut: 19, linesRemoved: 99.1, charsIn: 319414, charsOut: 3996, crashIn: 154, crashOut: 18, omittedProtected: 394, crashKept: "yes" },
    { id: "openstack", name: "OpenStack", file: "OpenStack_2k.log", system: "OpenStack Nova", about: "OpenStack Nova API logs. 21 crash-regex hits, 15 fit. Long lines, so few rows fill 4,000 characters.", linesIn: 2000, linesOut: 15, linesRemoved: 99.3, charsIn: 595119, charsOut: 3989, crashIn: 21, crashOut: 15, omittedProtected: 90, crashKept: "yes" },
  ],
};
