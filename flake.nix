{
  description = "AGS-based shell in default libadwaita style";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    ags = {
      url = "github:aylur/ags/bbee2f18939f1ec7ff720e717cf305e73635628f";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    ags,
  }: let
    pname = "adw-shell";
    entry = "app.ts";

    supportedSystems = ["x86_64-linux" "aarch64-linux"];
    forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
    pkgsFor = system: nixpkgs.legacyPackages.${system};

    agsFor = system: let
      agsPackage = ags.packages.${system}.default;
    in
      agsPackage.overrideAttrs (previous: {
        passthru =
          (previous.passthru or {})
          // {
            # Reuse AGS's locked npm dependencies, exposing only its TypeScript compiler and SDK.
            typescript = agsPackage.jsPackage.overrideAttrs (_: {
              name = "ags-typescript";
              inherit (agsPackage.jsPackage) npmDeps;

              installPhase = ''
                runHook preInstall

                mkdir -p $out/lib/node_modules $out/bin
                cp -r node_modules/typescript $out/lib/node_modules/
                ln -s $out/lib/node_modules/typescript/bin/tsc $out/bin/tsc
                ln -s $out/lib/node_modules/typescript/bin/tsserver $out/bin/tsserver

                runHook postInstall
              '';
            });
          };
      });

    mkExtraPackagesFor = system: let
      pkgs = pkgsFor system;

      astalPackages = with ags.packages.${system}; [
        apps
        astal4
        battery
        bluetooth
        hyprland
        io
        mpris
        network
        notifd
        powerprofiles
        tray
        wireplumber
      ];
    in
      astalPackages
      ++ [
        pkgs.libadwaita
        pkgs.libsoup_3
      ];

    mkPackagesFor = system: let
      pkgs = pkgsFor system;
      extraPackages = mkExtraPackagesFor system;
    in {
      default = pkgs.stdenv.mkDerivation {
        name = pname;
        src = ./.;

        nativeBuildInputs = with pkgs; [
          wrapGAppsHook4
          gobject-introspection
          (agsFor system)
          makeWrapper
        ];

        buildInputs = extraPackages ++ [pkgs.gjs];

        installPhase = ''
          runHook preInstall

          mkdir -p $out/bin
          mkdir -p $out/share
          cp -r * $out/share
          ags bundle ${entry} $out/bin/${pname} -d "SRC='$out/share'"

          wrapProgram $out/bin/${pname} \
            --prefix PATH : ${pkgs.lib.makeBinPath (with pkgs; [
            # Runtime dependencies.
            dart-sass
          ])}

          runHook postInstall
        '';
      };

      ags = agsFor system;
    };

    mkDevShellFor = system: let
      pkgs = pkgsFor system;
      agsPackage = (agsFor system).override {
        inherit extraPackages;
      };
      extraPackages = mkExtraPackagesFor system;
      typescript = agsPackage.typescript;
    in {
      default = pkgs.mkShell {
        buildInputs = [
          agsPackage
          pkgs.biome
          pkgs.dart-sass
          pkgs.nodejs
          typescript
        ];

        shellHook = ''
          mkdir -p node_modules
          rm -f node_modules/ags
          ln -sf ${agsPackage}/share/ags/js node_modules/ags
          ln -sfn ${typescript}/lib/node_modules/typescript node_modules/typescript
        '';
      };
    };
  in {
    packages = forAllSystems mkPackagesFor;
    devShells = forAllSystems mkDevShellFor;
  };
}
