import { useForm } from "@inertiajs/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type LoginFormProps = React.ComponentProps<"form">

export function LoginForm({
  className,
  ...props
}: LoginFormProps) {
  const form = useForm({
    email: "",
    password: "",
  })

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    form.post("/login", {
      onFinish: () => {
        form.reset("password")
      },
    })
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">
            Login to your account
          </h1>

          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="email">
            Email
          </FieldLabel>

          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={form.data.email}
            onChange={(event) => {
              form.setData("email", event.target.value)
            }}
            disabled={form.processing}
            className={cn(
              "placeholder:text-muted-foreground",
              form.errors.email && "border-destructive"
            )}
          />
          {form.errors.email && (
            <p className="text-sm text-destructive">
              {form.errors.email}
            </p>
          )}
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">
              Password
            </FieldLabel>

            <a
              href="/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>

          <Input
            id="password"
            type="password"
            value={form.data.password}
            onChange={(event) => {
              form.setData("password", event.target.value)
            }}
            disabled={form.processing}
            className={cn(
              "placeholder:text-muted-foreground",
              form.errors.password && "border-destructive"
            )}
          />
          {form.errors.password && (
            <p className="text-sm text-destructive">
              {form.errors.password}
            </p>
          )}
        </Field>

        <Field>
          <Button
            type="submit"
            disabled={form.processing}
          >
            {form.processing ? "Logging in..." : "Login"}
          </Button>
        </Field>

        <FieldSeparator>
          Or continue with
        </FieldSeparator>

        <Field>
          <Button
            variant="outline"
            type="button"
            disabled
          >
            Login with Google
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}