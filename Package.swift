// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "ReactNativeEnrichedHtml",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "ReactNativeEnrichedHtml", targets: ["ReactNativeEnrichedHtml"]),
    ],
    dependencies: [
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
        .package(name: "React-GeneratedCode", path: "../../../ios"),
    ],
    targets: [
        .target(
            name: "ReactNativeEnrichedHtml",
            dependencies: [.product(name: "ReactHeaders", package: "ReactNative"), .product(name: "ReactNativeHeaders", package: "ReactNative"), .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"), .product(name: "ReactAppHeaders", package: "React-GeneratedCode")],
            path: ".",
            exclude: [
              "node_modules",
              "android",
              "lib",
              "src",
            ],
            sources: [
                "cpp/GumboParser",
                "cpp/parser",
                "ios"
            ],
            publicHeadersPath: "ios",
            cSettings: [.headerSearchPath("cpp/GumboParser"), .headerSearchPath("cpp/parser"), .headerSearchPath("ios"), .headerSearchPath("."), .unsafeFlags(["-include", "react-native-spm-prefix.h"])],
            cxxSettings: [.headerSearchPath("cpp/GumboParser"), .headerSearchPath("cpp/parser"), .headerSearchPath("ios"), .headerSearchPath("."), .unsafeFlags(["-include", "react-native-spm-prefix.h"]), .define("DEBUG", .when(configuration: .debug)), .define("NDEBUG", .when(configuration: .release))],
            linkerSettings: [.linkedFramework("UIKit"), .linkedFramework("Foundation"), .linkedFramework("CoreGraphics")]
        ),
    ],
    cxxLanguageStandard: .cxx20
)
