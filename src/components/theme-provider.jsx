<div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
  <div className="flex items-center justify-between gap-4">
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-foreground">
        Appearance
      </h3>
      <p className="text-xs text-muted-foreground">
        Choose how Cero looks on this device.
      </p>
    </div>

    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="h-10 w-[140px] rounded-xl">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>

      <SelectContent align="end">
        <SelectItem value="system">
          <span className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            System
          </span>
        </SelectItem>

        <SelectItem value="light">
          <span className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Light
          </span>
        </SelectItem>

        <SelectItem value="dark">
          <span className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Dark
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>