import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-[70dvh] place-items-center px-6 text-center">
      <div>
        <p className="text-6xl font-extrabold text-accent">404</p>
        <h1 className="mt-3 text-2xl font-bold">Sorry, this page isn&apos;t available.</h1>
        <p className="mt-2 text-muted">The link may be broken, or the page may have been removed.</p>
        <Link href="/" className={buttonClass("primary", "lg", "mt-6")}>
          Back to Moments
        </Link>
      </div>
    </div>
  );
}
